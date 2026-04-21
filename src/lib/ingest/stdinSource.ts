import process from 'node:process'
import { LineSplitter } from './lineSplitter.js'
import type { SourceCallbacks, SourceSubscription } from './sourceTypes.js'
import type { SourceSpec } from '../../types.js'

export function createStdinSource(spec: SourceSpec, callbacks: SourceCallbacks): SourceSubscription {
  const splitter = new LineSplitter()

  function onData(chunk: Buffer | string) {
    const text = typeof chunk === 'string' ? chunk : chunk.toString('utf8')
    for (const line of splitter.push(text)) {
      callbacks.onLine(line)
    }
  }

  function onEnd() {
    for (const line of splitter.flush()) {
      callbacks.onLine(line)
    }
    callbacks.onEnd()
  }

  process.stdin.setEncoding('utf8')
  process.stdin.on('data', onData)
  process.stdin.on('end', onEnd)
  process.stdin.resume()

  return {
    spec,
    stop() {
      process.stdin.off('data', onData)
      process.stdin.off('end', onEnd)
    },
  }
}
