import path from 'node:path'
import type { LoggerCliOptions, SourceSpec } from '../../types.js'

export function createSourceSpecs(options: LoggerCliOptions, stdinIsTty: boolean): SourceSpec[] {
  if (options.files.length > 0) {
    return options.files.map((file, index) => ({
      id: `file-${index}`,
      label: path.basename(file),
      type: 'file',
      location: file,
    }))
  }

  if (options.url) {
    return [{
      id: 'url-0',
      label: 'url',
      type: 'url',
      location: options.url,
    }]
  }

  if (options.cmd) {
    return [{
      id: 'cmd-0',
      label: 'cmd',
      type: 'cmd',
      location: options.cmd,
    }]
  }

  if (!stdinIsTty) {
    return [{
      id: 'stdin-0',
      label: 'stdin',
      type: 'stdin',
      location: 'stdin',
    }]
  }

  return []
}
