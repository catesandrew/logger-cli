import type { NormalizedLevel } from '../../types.js'

export function normalizeLevel(value: unknown): NormalizedLevel {
  const raw = String(value ?? '').toLowerCase()
  if (raw.includes('trace')) return 'trace'
  if (raw.includes('debug')) return 'debug'
  if (raw === 'warning' || raw.includes('warn')) return 'warn'
  if (raw.includes('error')) return 'error'
  if (raw.includes('fatal')) return 'fatal'
  if (raw.includes('info')) return 'info'
  return 'unknown'
}
