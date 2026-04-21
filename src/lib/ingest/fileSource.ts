import fs from 'node:fs'
import path from 'node:path'
import { LineSplitter } from './lineSplitter.js'
import type { SourceCallbacks, SourceSubscription } from './sourceTypes.js'
import type { SourceSpec } from '../../types.js'

export function createFileSource(spec: SourceSpec, callbacks: SourceCallbacks): SourceSubscription {
  const stream = fs.createReadStream(path.resolve(spec.location), { encoding: 'utf8' })
  const splitter = new LineSplitter()

  stream.on('data', (chunk: string | Buffer) => {
    const text = typeof chunk === 'string' ? chunk : chunk.toString('utf8')
    for (const line of splitter.push(text)) {
      callbacks.onLine(line)
    }
  })
  stream.on('end', () => {
    for (const line of splitter.flush()) {
      callbacks.onLine(line)
    }
    callbacks.onEnd()
  })
  stream.on('error', (error) => callbacks.onError(error))

  return {
    spec,
    stop() {
      stream.destroy()
    },
  }
}
