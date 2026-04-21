import { LineSplitter } from './lineSplitter.js'
import type { SourceCallbacks, SourceSubscription } from './sourceTypes.js'
import type { SourceSpec } from '../../types.js'

export function createUrlSource(spec: SourceSpec, callbacks: SourceCallbacks): SourceSubscription {
  const controller = new AbortController()
  const splitter = new LineSplitter()

  void (async () => {
    try {
      const response = await fetch(spec.location, { signal: controller.signal })
      if (!response.body) {
        throw new Error(`No response body for ${spec.location}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      while (true) {
        const { value, done } = await reader.read()
        if (done) {
          break
        }
        const chunk = decoder.decode(value, { stream: true })
        for (const line of splitter.push(chunk)) {
          callbacks.onLine(line)
        }
      }

      for (const line of splitter.flush()) {
        callbacks.onLine(line)
      }
      callbacks.onEnd()
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        return
      }
      callbacks.onError(error as Error)
    }
  })()

  return {
    spec,
    stop() {
      controller.abort()
    },
  }
}
