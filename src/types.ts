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
  mergeSort: 'time' | 'source'
  configPath?: string
}

export interface LoggerColumn {
  key: string
  path: string
}

export interface LoggerConfig {
  columns: LoggerColumn[]
  keybindings?: Partial<Record<KeyAction, string[]>>
  mainLineTemplate?: string
  placeholderFormat?: string
  contextPath?: string
  levelMap?: Record<string, NormalizedLevel>
  queryMode?: {
    debounceMs?: number
    noHint?: boolean
    focusGlyph?: string
    blurGlyph?: string
  }
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

export type ReplMode = 'browse' | 'filter' | 'detail-search' | 'query'

export type KeyAction =
  | 'openHelp'
  | 'openFilter'
  | 'nextMode'
  | 'prevMode'
  | 'toggleReverse'
  | 'levelTrace'
  | 'levelDebug'
  | 'levelInfo'
  | 'levelWarn'
  | 'levelError'
  | 'levelFatal'
  | 'nextTab'
  | 'prevTab'
  | 'moveUp'
  | 'moveDown'
  | 'pageUp'
  | 'pageDown'
  | 'jumpTop'
  | 'jumpBottom'
  | 'enterDetail'
  | 'leaveDetail'
  | 'toggleFold'
  | 'detailSearch'
  | 'repeatSearchNext'
  | 'repeatSearchPrev'
  | 'copyValue'
  | 'copyPath'
  | 'toggleAnsi'
  | 'cycleMergeSort'
  | 'copyQuery'
  | 'copyQueryResult'
  | 'acceptAutocomplete'
  | 'expandAll'
  | 'collapseAll'

export interface QueryResultItem {
  entryId: number
  sourceId: string
  result: unknown
}
