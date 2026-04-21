import { normalizeLevel } from './normalizeLevel.js'

function firstValue(record: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    if (key in record) {
      return record[key]
    }
  }
  return undefined
}

export function extractTime(record: Record<string, unknown>): { time?: string; timestampMs?: number } {
  const raw = firstValue(record, ['time', 'timestamp', 'ts'])
  if (raw === undefined) {
    return {}
  }
  if (typeof raw === 'number') {
    return {
      time: new Date(raw).toISOString(),
      timestampMs: raw,
    }
  }
  const maybeDate = new Date(String(raw))
  if (!Number.isNaN(maybeDate.getTime())) {
    return {
      time: maybeDate.toISOString(),
      timestampMs: maybeDate.getTime(),
    }
  }
  return { time: String(raw) }
}

export function extractLevel(record: Record<string, unknown>): { levelRaw?: string; level: ReturnType<typeof normalizeLevel> } {
  const raw = firstValue(record, ['level', 'severity'])
  return {
    levelRaw: raw === undefined ? undefined : String(raw),
    level: normalizeLevel(raw),
  }
}

export function extractMessage(record: Record<string, unknown>): string {
  const raw = firstValue(record, ['msg', 'message'])
  if (raw !== undefined) {
    return String(raw)
  }

  const json = JSON.stringify(record)
  return json.length > 160 ? `${json.slice(0, 157)}...` : json
}
