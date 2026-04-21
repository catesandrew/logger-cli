import type { LoggerCliOptions, LogEntry, LoggerSnapshot, SourceSnapshot, SourceSpec, LoggerConfig } from './types.js'
import { createSourceSpecs } from './lib/ingest/createSources.js'
import { RingBuffer } from './lib/ingest/ringBuffer.js'
import { createFileSource } from './lib/ingest/fileSource.js'
import { createStdinSource } from './lib/ingest/stdinSource.js'
import { createUrlSource } from './lib/ingest/urlSource.js'
import { createCommandSource } from './lib/ingest/commandSource.js'
import { parseLine } from './lib/parse/parseLine.js'
import type { SourceCallbacks, SourceSubscription } from './lib/ingest/sourceTypes.js'
import { loadLoggerConfig } from './lib/config/configLoader.js'
import { createMergedEntries } from './query.js'

type Listener = () => void

interface SourceState {
  spec: SourceSpec
  buffer: RingBuffer<LogEntry>
  total: number
  jsonCount: number
  textCount: number
}

export class LoggerSession {
  private readonly listeners = new Set<Listener>()
  private readonly sourceStates = new Map<string, SourceState>()
  private readonly subscriptions: SourceSubscription[] = []
  private readonly pending = new Map<string, LogEntry[]>()
  private flushTimer: ReturnType<typeof setTimeout> | null = null
  private nextEntryId = 1
  private version = 0

  constructor(
    private readonly options: LoggerCliOptions,
    readonly specs: SourceSpec[],
    private readonly config: LoggerConfig,
  ) {
    for (const spec of specs) {
      this.sourceStates.set(spec.id, {
        spec,
        buffer: new RingBuffer<LogEntry>(options.maxEntries),
        total: 0,
        jsonCount: 0,
        textCount: 0,
      })
    }
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  getSnapshot(): LoggerSnapshot {
    const sources: SourceSnapshot[] = this.specs.map((spec) => {
      if (spec.id === 'merge-0') {
        const states = this.specs
          .filter((source) => source.id !== 'merge-0')
          .map((source) => this.sourceStates.get(source.id))
          .filter((state): state is SourceState => Boolean(state))

        return {
          spec,
          total: states.reduce((sum, state) => sum + state.total, 0),
          jsonCount: states.reduce((sum, state) => sum + state.jsonCount, 0),
          textCount: states.reduce((sum, state) => sum + state.textCount, 0),
        }
      }

      const state = this.sourceStates.get(spec.id)
      return {
        spec,
        total: state?.total ?? 0,
        jsonCount: state?.jsonCount ?? 0,
        textCount: state?.textCount ?? 0,
      }
    })
    return {
      version: this.version,
      sources,
      config: this.config,
    }
  }

  getEntries(sourceId: string, reverse: boolean): LogEntry[] {
    if (sourceId === 'merge-0') {
      const grouped = this.specs
        .filter((spec) => spec.id !== 'merge-0')
        .map((spec) => this.sourceStates.get(spec.id)?.buffer.toArray(false) ?? [])
      return createMergedEntries(grouped, reverse)
    }
    return this.sourceStates.get(sourceId)?.buffer.toArray(reverse) ?? []
  }

  async start(): Promise<void> {
    for (const spec of this.specs) {
      if (spec.id === 'merge-0') {
        continue
      }
      const callbacks: SourceCallbacks = {
        onLine: (line) => this.enqueueLine(spec, line),
        onError: () => this.flush(),
        onEnd: () => this.flush(),
      }

      const subscription =
        spec.type === 'file'
          ? createFileSource(spec, callbacks)
          : spec.type === 'stdin'
            ? createStdinSource(spec, callbacks)
            : spec.type === 'url'
              ? createUrlSource(spec, callbacks)
              : createCommandSource(spec, callbacks)

      this.subscriptions.push(subscription)
    }
  }

  stop(): void {
    for (const subscription of this.subscriptions) {
      subscription.stop()
    }
    if (this.flushTimer) {
      clearTimeout(this.flushTimer)
      this.flushTimer = null
    }
  }

  private enqueueLine(spec: SourceSpec, raw: string): void {
    const parsed = parseLine(raw)
    const entry: LogEntry = {
      id: this.nextEntryId++,
      sourceId: spec.id,
      raw,
      prefix: parsed.prefix,
      kind: parsed.kind,
      parsed: parsed.parsed,
      time: parsed.time,
      timestampMs: parsed.timestampMs,
      level: parsed.level,
      levelRaw: parsed.levelRaw,
      message: parsed.message,
    }

    const pending = this.pending.get(spec.id) ?? []
    pending.push(entry)
    this.pending.set(spec.id, pending)
    this.scheduleFlush()
  }

  private scheduleFlush(): void {
    if (this.flushTimer) {
      return
    }
    this.flushTimer = setTimeout(() => {
      this.flushTimer = null
      this.flush()
    }, 50)
  }

  private flush(): void {
    if (this.pending.size === 0) {
      return
    }

    for (const [sourceId, entries] of this.pending) {
      const state = this.sourceStates.get(sourceId)
      if (!state) {
        continue
      }

      for (const entry of entries) {
        state.buffer.push(entry)
        state.total += 1
        if (entry.kind === 'json') {
          state.jsonCount += 1
        } else {
          state.textCount += 1
        }
      }
    }

    this.pending.clear()
    this.version += 1
    for (const listener of this.listeners) {
      listener()
    }
  }
}

export class QueryEngine {
  async start(options: LoggerCliOptions): Promise<LoggerSession> {
    const specs = createSourceSpecs(options, process.stdin.isTTY ?? false)
    const config = await loadLoggerConfig()
    const session = new LoggerSession(options, specs, config)
    await session.start()
    return session
  }
}
