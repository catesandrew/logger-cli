export function parsePrefixedJson(line: string): { prefix?: string; jsonText?: string } {
  const divider = ' | '
  const index = line.indexOf(divider)
  if (index < 0) {
    return {}
  }

  const prefix = line.slice(0, index).trim()
  const jsonText = line.slice(index + divider.length).trim()

  if (!jsonText.startsWith('{') && !jsonText.startsWith('[')) {
    return {}
  }

  return { prefix, jsonText }
}
