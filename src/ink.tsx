import React from 'react'
import { render, type Instance, type RenderOptions } from 'ink'
import { ThemeProvider } from './ink/root.js'
import { createInkOutputProxy } from './ink/outputProxy.js'

export interface Root {
  render(node: React.ReactElement): void
  waitUntilExit(): Promise<void>
  unmount(error?: Error): void
}

export async function createRoot(options: RenderOptions): Promise<Root> {
  let instance: Instance | undefined
  const inkStdout = createInkOutputProxy(options.stdout)

  function wrap(node: React.ReactElement): React.ReactElement {
    return <ThemeProvider>{node}</ThemeProvider>
  }

  return {
    render(node) {
      if (!instance) {
        instance = render(wrap(node), { ...options, stdout: inkStdout })
        return
      }
      instance.rerender(wrap(node))
    },
    async waitUntilExit() {
      if (instance) {
        await instance.waitUntilExit()
      }
    },
    unmount(error) {
      instance?.unmount(error)
    },
  }
}
