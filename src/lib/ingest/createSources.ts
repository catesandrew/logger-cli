import path from 'node:path'
import type { LoggerCliOptions, SourceSpec } from '../../types.js'

export function createSourceSpecs(options: LoggerCliOptions, stdinIsTty: boolean): SourceSpec[] {
  const specs: SourceSpec[] = []

  if (options.files.length > 0) {
    const fileSpecs: SourceSpec[] = options.files.map((file, index) => ({
      id: `file-${index}`,
      label: path.basename(file),
      type: 'file',
      location: file,
    }))
    specs.push(...fileSpecs)
  }

  if (options.url) {
    specs.push({
      id: 'url-0',
      label: 'url',
      type: 'url',
      location: options.url,
    } satisfies SourceSpec)
  }

  if (options.cmd) {
    specs.push({
      id: 'cmd-0',
      label: 'cmd',
      type: 'cmd',
      location: options.cmd,
    } satisfies SourceSpec)
  }

  if (!stdinIsTty && specs.length === 0) {
    specs.push({
      id: 'stdin-0',
      label: 'stdin',
      type: 'stdin',
      location: 'stdin',
    } satisfies SourceSpec)
  }

  if (options.merge && specs.length > 1) {
    return [
      {
        id: 'merge-0',
        label: 'merged',
        type: 'file',
        location: '__merged__',
      } satisfies SourceSpec,
      ...specs,
    ]
  }

  return specs
}
