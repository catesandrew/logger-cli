import { spawnSync } from 'node:child_process'

let jqAvailable: boolean | undefined

function hasJq(): boolean {
  if (jqAvailable !== undefined) {
    return jqAvailable
  }
  const result = spawnSync('jq', ['--version'], { stdio: 'ignore' })
  jqAvailable = result.status === 0
  return jqAvailable
}

function evaluatePath(value: unknown, query: string): unknown {
  if (query === '.') return value
  const trimmed = query.replace(/^\./, '')
  const tokens = trimmed
    .replace(/\[(\d+)\]/g, '.$1')
    .split('.')
    .filter(Boolean)

  let current: unknown = value
  for (const token of tokens) {
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

export function evaluateQuery(value: unknown, query: string): unknown {
  const trimmed = query.trim()
  if (!trimmed) return value

  if (hasJq()) {
    const result = spawnSync('jq', ['-c', trimmed], {
      input: JSON.stringify(value),
      encoding: 'utf8',
    })
    if (result.status === 0) {
      const stdout = result.stdout.trim()
      if (!stdout) return null
      try {
        return JSON.parse(stdout)
      } catch {
        return stdout
      }
    }
  }

  if (trimmed === '.') return value
  if (/^\.[A-Za-z0-9_.\[\]]+$/.test(trimmed)) {
    return evaluatePath(value, trimmed)
  }

  return `Unsupported query without jq: ${trimmed}`
}
