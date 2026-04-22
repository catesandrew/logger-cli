function walk(value: unknown, prefix = '$'): string[] {
  if (!value || typeof value !== 'object') {
    return []
  }

  if (Array.isArray(value)) {
    const paths: string[] = []
    value.forEach((item, index) => {
      const childPath = `${prefix}[${index}]`
      paths.push(childPath)
      paths.push(...walk(item, childPath))
    })
    return paths
  }

  const paths: string[] = []
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    const childPath = `${prefix}.${key}`
    paths.push(childPath)
    paths.push(...walk(child, childPath))
  }
  return paths
}

export function getQueryAutocompleteSuggestion(input: string, value: unknown): string | null {
  const trimmed = input.trim()
  if (!trimmed.startsWith('.')) return null

  const paths = walk(value).map((path) => path.replace(/^\$/, ''))
  return paths.find((path) => path.startsWith(trimmed)) ?? null
}
