import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import { LineSplitter } from './lineSplitter.js'
import type { FileSourceOptions, SourceCallbacks, SourceSubscription } from './sourceTypes.js'
import type { SourceSpec } from '../../types.js'

export function createFileSource(
  spec: SourceSpec,
  callbacks: SourceCallbacks,
  options: FileSourceOptions = {},
): SourceSubscription {
  const filePath = path.resolve(spec.location)
  const stream = fs.createReadStream(filePath, { encoding: 'utf8' })
  const splitter = new LineSplitter()
  let offset = 0
  let stopped = false
  let reading = false
  const pollIntervalMs = options.pollIntervalMs ?? 100

  async function readAppendedBytes() {
    if (reading || stopped) {
      return
    }
    reading = true
    try {
      const stats = await fsp.stat(filePath)
      if (stats.size <= offset) {
        return
      }
      const handle = await fsp.open(filePath, 'r')
      try {
        const length = stats.size - offset
        const buffer = Buffer.alloc(length)
        await handle.read(buffer, 0, length, offset)
        offset = stats.size
        const text = buffer.toString('utf8')
        for (const line of splitter.push(text)) {
          callbacks.onLine(line)
        }
      } finally {
        await handle.close()
      }
    } catch (error) {
      callbacks.onError(error as Error)
    } finally {
      reading = false
    }
  }

  stream.on('data', (chunk: string | Buffer) => {
    const text = typeof chunk === 'string' ? chunk : chunk.toString('utf8')
    offset += Buffer.byteLength(text)
    for (const line of splitter.push(text)) {
      callbacks.onLine(line)
    }
  })
  stream.on('end', () => {
    if (options.follow ?? true) {
      fs.watchFile(filePath, { interval: pollIntervalMs }, () => {
        void readAppendedBytes()
      })
      return
    }
    for (const line of splitter.flush()) {
      callbacks.onLine(line)
    }
    callbacks.onEnd()
  })
  stream.on('error', (error) => callbacks.onError(error))

  return {
    spec,
    stop() {
      stopped = true
      fs.unwatchFile(filePath)
      stream.destroy()
    },
  }
}
