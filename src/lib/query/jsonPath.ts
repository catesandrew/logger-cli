function tokenize(path: string): string[] {
  return path
    .replace(/^\$\./, '')
    .replace(/\[(\d+)\]/g, '.$1')
    .split('.')
    .filter(Boolean)
}

export function getJsonPathValue(value: unknown, path: string): unknown {
  if (!path.startsWith('$')) {
    return undefined
  }

  let current: unknown = value
  for (const token of tokenize(path)) {
    if (Array.isArray(current)) {
      const index = Number.parseInt(token, 10)
      current = Number.isNaN(index) ? undefined : current[index]
      continue
    }

    if (!current || typeof current !== 'object') {
      return undefined
    }

    current = (current as Record<string, unknown>)[token]
  }

  return current
}
