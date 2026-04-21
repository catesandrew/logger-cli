import { Command } from 'commander'
import type { LoggerCliOptions } from '../types.js'

export function buildProgram(): Command {
  return new Command('logger')
    .description('Interactive mixed JSON/text log viewer')
    .argument('[files...]', 'Log files to open as tabs')
    .option('--url <url>', 'Stream logs from an HTTP GET response body')
    .option('--cmd <command>', 'Spawn a command and read stdout/stderr as log lines')
    .option('--max <count>', 'Maximum entries to keep in memory', '50000')
    .option('--merge', 'Merge multiple sources into a single chronological view', false)
    .option('--preserve-ansi', 'Preserve ANSI in raw text detail view', false)
}

export function parseCli(argv: string[]): LoggerCliOptions {
  const program = buildProgram()
  program.parse(argv)
  const options = program.opts<{
    url?: string
    cmd?: string
    max: string
    merge?: boolean
    preserveAnsi?: boolean
  }>()

  return {
    files: program.args as string[],
    url: options.url,
    cmd: options.cmd,
    maxEntries: Number.parseInt(options.max, 10) || 50000,
    merge: Boolean(options.merge),
    preserveAnsi: Boolean(options.preserveAnsi),
  }
}
