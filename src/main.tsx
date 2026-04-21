#!/usr/bin/env node
import { fileURLToPath } from 'node:url'
import process from 'node:process'
import { parseCli } from './entrypoints/cli.js'
import { initializeEntrypoint } from './entrypoints/init.js'
import { createRoot } from './ink.js'
import { getRenderContext, renderAndRun, showSetupScreens } from './interactiveHelpers.js'
import { launchRepl } from './replLauncher.js'
import { QueryEngine } from './QueryEngine.js'

interface RuntimeIo {
  stdout?: Pick<typeof process.stdout, 'write'>
}

export async function runCli(argv: string[], io: RuntimeIo = {}): Promise<number> {
  const options = parseCli(argv)
  const init = await initializeEntrypoint()
  const root = await createRoot(getRenderContext().renderOptions)
  await showSetupScreens(root)
  await launchRepl({
    root,
    options,
    init,
    queryEngine: new QueryEngine(),
  })
  await renderAndRun(root, init.deferredPrefetches)
  return 0
}

export async function main(argv: string[] = process.argv): Promise<void> {
  try {
    process.exitCode = await runCli(argv)
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`)
    process.exitCode = 1
  }
}

const currentFilePath = fileURLToPath(import.meta.url)
const isBunMain = typeof (import.meta as ImportMeta & { main?: boolean }).main === 'boolean'
  ? Boolean((import.meta as ImportMeta & { main?: boolean }).main)
  : false

if (isBunMain || process.argv[1] === currentFilePath) {
  void main()
}
