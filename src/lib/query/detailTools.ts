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

export function getJsonTreeCopyValue(
  line: JsonTreeLine,
  mode: 'path' | 'value',
): string {
  return mode === 'path' ? line.id : line.valuePreview
}
