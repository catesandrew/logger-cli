export type EntryKind = 'json' | 'text'
export type NormalizedLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal' | 'unknown'
export type SourceType = 'file' | 'stdin' | 'url' | 'cmd'
export type PaneFocus = 'list' | 'detail'
export type DetailViewMode = 'tree' | 'raw'

export interface SourceSpec {
  id: string
  label: string
  type: SourceType
  location: string
}

export interface LoggerCliOptions {
  files: string[]
  url?: string
  cmd?: string
  maxEntries: number
  preserveAnsi: boolean
  merge: boolean
}

export interface LoggerColumn {
  key: string
  path: string
}

export interface LoggerConfig {
  columns: LoggerColumn[]
}

export interface LogEntry {
  id: number
  sourceId: string
  raw: string
  prefix?: string
  kind: EntryKind
  parsed?: unknown
  time?: string
  timestampMs?: number
  level: NormalizedLevel
  levelRaw?: string
  message: string
}

export interface ParsedLine {
  prefix?: string
  kind: EntryKind
  parsed?: unknown
  time?: string
  timestampMs?: number
  level: NormalizedLevel
  levelRaw?: string
  message: string
}

export interface JsonTreeLine {
  id: string
  depth: number
  key?: string
  valuePreview: string
  collapsible: boolean
  collapsed: boolean
}

export interface SourceSnapshot {
  spec: SourceSpec
  total: number
  jsonCount: number
  textCount: number
}

export interface LoggerSnapshot {
  version: number
  sources: SourceSnapshot[]
  config: LoggerConfig
  merged: boolean
}

export type ReplMode = 'browse' | 'filter' | 'detail-search'
