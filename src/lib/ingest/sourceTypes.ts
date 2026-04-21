import type { SourceSpec } from '../../types.js'

export interface SourceSubscription {
  spec: SourceSpec
  stop(): void
}

export interface SourceCallbacks {
  onLine(line: string): void
  onError(error: Error): void
  onEnd(): void
}
