import type { LogEntry } from '../../types.js'
import type { ComparisonOperator, FieldPathStep, FieldRef, FilterNode, FilterValue } from './filterAst.js'

function toBuiltinContext(entry: LogEntry): Record<string, unknown> {
  return {
    source: entry.sourceId,
    kind: entry.kind,
    level: entry.levelRaw ?? entry.level,
    message: entry.message,
    prefix: entry.prefix,
    raw: entry.raw,
    time: entry.time,
    timestamp: entry.timestampMs,
  }
}

function resolvePath(root: unknown, steps: FieldPathStep[]): unknown[] {
  let current: unknown[] = [root]

  for (const step of steps) {
    const next: unknown[] = []
    for (const value of current) {
      if (step.kind === 'key') {
        if (value && typeof value === 'object' && step.value && step.value in (value as Record<string, unknown>)) {
          next.push((value as Record<string, unknown>)[String(step.value)])
        }
      } else if (step.kind === 'index') {
        if (Array.isArray(value) && typeof step.value === 'number') {
          next.push(value[step.value])
        }
      } else if (step.kind === 'wildcard') {
        if (Array.isArray(value)) {
          next.push(...value)
        }
      }
    }
    current = next.filter((value) => value !== undefined)
  }

  return current
}

export function getFieldValues(entry: LogEntry, field: FieldRef): unknown[] {
  const builtins = toBuiltinContext(entry)
  if (!field.leadingDot && field.steps.length === 1 && field.steps[0]?.kind === 'key') {
    const key = String(field.steps[0].value)
    if (key in builtins) {
      return [builtins[key]]
    }
  }

  const roots: unknown[] = []
  if (!field.leadingDot) {
    roots.push(builtins)
  }
  roots.push(entry.parsed)

  const values: unknown[] = []
  for (const root of roots) {
    values.push(...resolvePath(root, field.steps))
  }
  return values
}

function wildcardToRegExp(pattern: string): RegExp {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')
  return new RegExp(`^${escaped}$`, 'i')
}

function compareSingle(value: unknown, operator: ComparisonOperator, needle: FilterValue | FilterValue[]): boolean {
  if (operator === 'in' || operator === 'not in') {
    const values = needle as FilterValue[]
    const matched = values.some((candidate) => String(value).toLowerCase() === String(candidate).toLowerCase())
    return operator === 'in' ? matched : !matched
  }

  if (operator === '=' || operator === '!=') {
    const matched = String(value).toLowerCase() === String(needle).toLowerCase()
    return operator === '=' ? matched : !matched
  }

  if (operator === '~=' || operator === '!~=') {
    const matched = String(value).toLowerCase().includes(String(needle).toLowerCase())
    return operator === '~=' ? matched : !matched
  }

  if (operator === 'like') {
    return wildcardToRegExp(String(needle)).test(String(value))
  }

  if (operator === '~~=') {
    return new RegExp(String(needle)).test(String(value))
  }

  const left = Number(value)
  const right = Number(needle)
  if (Number.isNaN(left) || Number.isNaN(right)) {
    return false
  }
  switch (operator) {
    case '>':
      return left > right
    case '>=':
      return left >= right
    case '<':
      return left < right
    case '<=':
      return left <= right
    default:
      return false
  }
}

function evaluateComparison(entry: LogEntry, field: FieldRef, operator: ComparisonOperator, value: FilterValue | FilterValue[]): boolean {
  const values = getFieldValues(entry, field)
  if (values.length === 0) {
    return field.optional
  }

  if (operator === '!=' || operator === '!~=' || operator === 'not in') {
    return values.every((item) => compareSingle(item, operator, value))
  }

  return values.some((item) => compareSingle(item, operator, value))
}

export function evaluateFilterNode(entry: LogEntry, node: FilterNode): boolean {
  switch (node.type) {
    case 'and':
      return evaluateFilterNode(entry, node.left) && evaluateFilterNode(entry, node.right)
    case 'or':
      return evaluateFilterNode(entry, node.left) || evaluateFilterNode(entry, node.right)
    case 'not':
      return !evaluateFilterNode(entry, node.node)
    case 'exists':
      return getFieldValues(entry, node.field).length > 0
    case 'comparison':
      return evaluateComparison(entry, node.field, node.operator, node.value)
  }
}
