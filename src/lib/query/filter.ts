import type { LogEntry } from '../../types.js'

export type QueryClause =
  | { type: 'substring'; value: string }
  | { type: 'field'; field: string; operator: ':' | '~'; value: string }

function getFieldValue(entry: LogEntry, field: string): unknown {
  if (field === 'source') return entry.sourceId
  if (field === 'kind') return entry.kind
  if (field === 'level') return entry.levelRaw ?? entry.level
  if (field === 'message') return entry.message

  let current: unknown = entry.parsed
  for (const part of field.split('.')) {
    if (!current || typeof current !== 'object' || !(part in (current as Record<string, unknown>))) {
      return undefined
    }
    current = (current as Record<string, unknown>)[part]
  }
  return current
}

export function parseQuery(input: string): QueryClause[] {
  return input
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map<QueryClause>((token) => {
      const substringIndex = token.indexOf('~')
      if (substringIndex > 0) {
        return {
          type: 'field',
          field: token.slice(0, substringIndex),
          operator: '~',
          value: token.slice(substringIndex + 1),
        }
      }

      const fieldIndex = token.indexOf(':')
      if (fieldIndex > 0) {
        return {
          type: 'field',
          field: token.slice(0, fieldIndex),
          operator: ':',
          value: token.slice(fieldIndex + 1),
        }
      }

      return {
        type: 'substring',
        value: token,
      }
    })
}

export function matchesQuery(entry: LogEntry, clauses: QueryClause[]): boolean {
  return clauses.every((clause) => {
    if (clause.type === 'substring') {
      const haystack = `${entry.message} ${entry.raw} ${entry.sourceId}`.toLowerCase()
      return haystack.includes(clause.value.toLowerCase())
    }

    const value = getFieldValue(entry, clause.field)
    if (value === undefined) {
      return false
    }

    const normalized = String(value).toLowerCase()
    const needle = clause.value.toLowerCase()

    if (clause.operator === ':') {
      return normalized === needle
    }

    return normalized.includes(needle)
  })
}
