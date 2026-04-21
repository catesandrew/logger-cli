import type { JsonTreeLine } from '../../types.js'

export function findJsonTreeMatch(
  lines: JsonTreeLine[],
  query: string,
  startIndex: number,
): number {
  const needle = query.toLowerCase()
  for (let index = Math.max(0, startIndex); index < lines.length; index += 1) {
    const line = lines[index]
    if (line && line.valuePreview.toLowerCase().includes(needle)) {
      return index
    }
  }
  return -1
}

export function findJsonTreeMatchWrapped(
  lines: JsonTreeLine[],
  query: string,
  startIndex: number,
  direction: 'forward' | 'backward',
): { index: number; wrapped: boolean } {
  if (direction === 'forward') {
    const direct = findJsonTreeMatch(lines, query, startIndex)
    if (direct >= 0) return { index: direct, wrapped: false }
    const wrapped = findJsonTreeMatch(lines, query, 0)
    return { index: wrapped, wrapped: wrapped >= 0 }
  }

  const needle = query.toLowerCase()
  for (let index = Math.min(startIndex, lines.length - 1); index >= 0; index -= 1) {
    const line = lines[index]
    if (line && line.valuePreview.toLowerCase().includes(needle)) {
      return { index, wrapped: false }
    }
  }

  for (let index = lines.length - 1; index >= 0; index -= 1) {
    const line = lines[index]
    if (line && line.valuePreview.toLowerCase().includes(needle)) {
      return { index, wrapped: true }
    }
  }

  return { index: -1, wrapped: false }
}

export function getJsonTreeCopyValue(
  line: JsonTreeLine,
  mode: 'path' | 'value',
): string {
  return mode === 'path' ? line.id : line.valuePreview
}

export function findTextMatchWrapped(
  text: string,
  query: string,
  startIndex: number,
  direction: 'forward' | 'backward',
): { index: number; wrapped: boolean } {
  const haystack = text.toLowerCase()
  const needle = query.toLowerCase()

  if (!needle) {
    return { index: -1, wrapped: false }
  }

  if (direction === 'forward') {
    const nextIndex = haystack.indexOf(needle, Math.max(0, startIndex))
    if (nextIndex >= 0) {
      return { index: nextIndex, wrapped: false }
    }
    const wrappedIndex = haystack.indexOf(needle)
    return { index: wrappedIndex, wrapped: wrappedIndex >= 0 }
  }

  const previousIndex = haystack.lastIndexOf(needle, Math.max(0, startIndex))
  if (previousIndex >= 0) {
    return { index: previousIndex, wrapped: false }
  }
  const wrappedIndex = haystack.lastIndexOf(needle)
  return { index: wrappedIndex, wrapped: wrappedIndex >= 0 }
}
