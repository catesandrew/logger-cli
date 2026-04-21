import { spawn } from 'node:child_process'
import { LineSplitter } from './lineSplitter.js'
import type { SourceCallbacks, SourceSubscription } from './sourceTypes.js'
import type { SourceSpec } from '../../types.js'

export function createCommandSource(spec: SourceSpec, callbacks: SourceCallbacks): SourceSubscription {
  const child = spawn('sh', ['-c', spec.location], {
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  const splitter = new LineSplitter()

  function handleChunk(chunk: Buffer | string) {
    const text = typeof chunk === 'string' ? chunk : chunk.toString('utf8')
    for (const line of splitter.push(text)) {
      callbacks.onLine(line)
    }
  }

  child.stdout.on('data', handleChunk)
  child.stderr.on('data', handleChunk)
  child.on('close', () => {
    for (const line of splitter.flush()) {
      callbacks.onLine(line)
    }
    callbacks.onEnd()
  })
  child.on('error', (error) => callbacks.onError(error))

  return {
    spec,
    stop() {
      child.kill('SIGTERM')
    },
  }
}
