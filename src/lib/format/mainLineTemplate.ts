import Handlebars from 'handlebars'
import type { LogEntry, LoggerConfig } from '../../types.js'

const DEFAULT_TEMPLATE = '{{timestamp}} {{level}} {{prefix}}{{message}}'
const cache = new Map<string, HandlebarsTemplateDelegate>()

function useColor(): boolean {
  return !process.env.NO_COLOR
}

function applyAnsi(code: string, value: string): string {
  if (!useColor()) return value
  return `${code}${value}\u001B[0m`
}

function getInstance(): typeof Handlebars {
  const instance = Handlebars.create()
  instance.registerHelper('bold', (value: string) => applyAnsi('\u001B[1m', String(value)))
  instance.registerHelper('red', (value: string) => applyAnsi('\u001B[31m', String(value)))
  instance.registerHelper('yellow', (value: string) => applyAnsi('\u001B[33m', String(value)))
  instance.registerHelper('green', (value: string) => applyAnsi('\u001B[32m', String(value)))
  instance.registerHelper('cyan', (value: string) => applyAnsi('\u001B[36m', String(value)))
  instance.registerHelper('blue', (value: string) => applyAnsi('\u001B[34m', String(value)))
  instance.registerHelper('purple', (value: string) => applyAnsi('\u001B[35m', String(value)))
  instance.registerHelper('uppercase', (value: string) => String(value).toUpperCase())
  instance.registerHelper('fixed_size', (value: string, size: number) => String(value).padEnd(Number(size)).slice(0, Number(size)))
  instance.registerHelper('min_size', (value: string, size: number) => String(value).padEnd(Number(size)))
  instance.registerHelper('level_style', (value: string) => {
    const level = String(value).toLowerCase()
    if (level.includes('error') || level.includes('fatal')) return applyAnsi('\u001B[31m', String(value))
    if (level.includes('warn')) return applyAnsi('\u001B[33m', String(value))
    if (level.includes('info')) return applyAnsi('\u001B[32m', String(value))
    if (level.includes('debug')) return applyAnsi('\u001B[34m', String(value))
    return String(value)
  })
  return instance
}

function getTemplate(source: string): HandlebarsTemplateDelegate {
  const existing = cache.get(source)
  if (existing) return existing
  const compiled = getInstance().compile(source)
  cache.set(source, compiled)
  return compiled
}

function substitutePlaceholders(entry: LogEntry, config: LoggerConfig): string {
  const format = config.placeholderFormat
  const contextPath = config.contextPath
  if (!format || !contextPath || typeof entry.parsed !== 'object' || !entry.parsed) {
    return entry.message
  }

  const [prefix, suffix] = format.split('key')
  if (prefix === undefined || suffix === undefined) {
    return entry.message
  }

  const context = (entry.parsed as Record<string, unknown>)[contextPath]
  if (!context || typeof context !== 'object') {
    return entry.message
  }

  return entry.message.replace(new RegExp(`${escapeRegExp(prefix)}([^${escapeRegExp(suffix)}]+)${escapeRegExp(suffix)}`, 'g'), (_match, key) => {
    const value = (context as Record<string, unknown>)[key]
    return value === undefined ? `${prefix}${key}${suffix}` : String(value)
  })
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function renderMainLine(entry: LogEntry, config: LoggerConfig): string {
  const template = config.mainLineTemplate ?? DEFAULT_TEMPLATE
  const compiled = getTemplate(template)
  return compiled({
    timestamp: entry.time ?? '--:--:--',
    level: entry.levelRaw ?? entry.level,
    message: substitutePlaceholders(entry, config),
    prefix: entry.prefix ? `${entry.prefix} ` : '',
    json: entry.parsed,
    raw: entry.raw,
  })
}
