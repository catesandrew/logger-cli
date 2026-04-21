import React from 'react'
import { Text } from 'ink'
import type { LogEntry, LoggerColumn } from '../types.js'
import { getJsonPathValue } from '../lib/query/jsonPath.js'
import { formatSourceLabel } from '../lib/query/sourceLabel.js'

function colorForLevel(level: LogEntry['level']): string {
  switch (level) {
    case 'trace':
      return 'gray'
    case 'debug':
      return 'blue'
    case 'info':
      return 'green'
    case 'warn':
      return 'yellow'
    case 'error':
    case 'fatal':
      return 'red'
    default:
      return 'white'
  }
}

function compactTime(entry: LogEntry): string {
  if (!entry.time) {
    return '--:--:--'
  }
  const date = new Date(entry.time)
  if (Number.isNaN(date.getTime())) {
    return entry.time.slice(0, 8)
  }
  return date.toISOString().slice(11, 19)
}

export function LogListRow(props: {
  entry: LogEntry
  selected: boolean
  width: number
  columns?: LoggerColumn[]
  mergedMode?: boolean
  sourceLabel?: string
}): React.ReactElement {
  const prefix = props.entry.prefix ? `${props.entry.prefix} ` : ''
  const labeledMessage = formatSourceLabel(
    Boolean(props.mergedMode),
    props.sourceLabel ?? props.entry.sourceId,
    `${prefix}${props.entry.message}`,
  )
  const columnText = (props.columns ?? [])
    .map((column) => {
      const value = getJsonPathValue(props.entry.parsed, column.path)
      return value === undefined ? '' : `${column.key}=${String(value)}`
    })
    .filter(Boolean)
    .join(' ')

  const rawText = `${compactTime(props.entry)} ${props.entry.level.toUpperCase().padEnd(5)} ${labeledMessage}${columnText ? ` ${columnText}` : ''}`
  const text = rawText.length > props.width ? `${rawText.slice(0, Math.max(0, props.width - 3))}...` : rawText

  return (
    <Text
      color={props.selected ? 'black' : colorForLevel(props.entry.level)}
      backgroundColor={props.selected ? 'white' : undefined}
    >
      {props.selected ? '>' : ' '} {text}
    </Text>
  )
}
