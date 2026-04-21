import type { ParsedLine } from '../../types.js'
import { extractLevel, extractMessage, extractTime } from './heuristics.js'
import { normalizeLevel } from './normalizeLevel.js'
import { parsePrefixedJson } from './parsePrefixedJson.js'

function parseJson(text: string): unknown | undefined {
  try {
    return JSON.parse(text) as unknown
  } catch {
    return undefined
  }
}

export function parseLine(raw: string): ParsedLine {
  const prefixed = parsePrefixedJson(raw)
  const candidateJson = prefixed.jsonText ?? raw.trim()
  const parsed = parseJson(candidateJson)

  if (parsed && typeof parsed === 'object' && parsed !== null) {
    const record = parsed as Record<string, unknown>
    const time = extractTime(record)
    const level = extractLevel(record)
    return {
      prefix: prefixed.prefix,
      kind: 'json',
      parsed,
      ...time,
      ...level,
      message: extractMessage(record),
    }
  }

  return {
    kind: 'text',
    prefix: prefixed.prefix,
    level: normalizeLevel(undefined),
    message: raw,
  }
}
