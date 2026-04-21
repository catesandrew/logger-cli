import path from 'node:path'
import type { LoggerCliOptions, SourceSpec } from '../../types.js'

export function createSourceSpecs(options: LoggerCliOptions, stdinIsTty: boolean): SourceSpec[] {
  if (options.files.length > 0) {
    const fileSpecs: SourceSpec[] = options.files.map((file, index) => ({
      id: `file-${index}`,
      label: path.basename(file),
      type: 'file',
      location: file,
    }))
    if (options.merge && fileSpecs.length > 1) {
      return [
        {
          id: 'merge-0',
          label: 'merged',
          type: 'file',
          location: '__merged__',
        } satisfies SourceSpec,
        ...fileSpecs,
      ]
    }
    return fileSpecs
  }

  if (options.url) {
    return [{
      id: 'url-0',
      label: 'url',
      type: 'url',
      location: options.url,
    } satisfies SourceSpec]
  }

  if (options.cmd) {
    return [{
      id: 'cmd-0',
      label: 'cmd',
      type: 'cmd',
      location: options.cmd,
    } satisfies SourceSpec]
  }

  if (!stdinIsTty) {
    return [{
      id: 'stdin-0',
      label: 'stdin',
      type: 'stdin',
      location: 'stdin',
    } satisfies SourceSpec]
  }

  return []
}
