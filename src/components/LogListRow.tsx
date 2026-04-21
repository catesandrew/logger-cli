import React from 'react'
import { Text } from 'ink'
import type { LogEntry } from '../types.js'

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
}): React.ReactElement {
  const prefix = props.entry.prefix ? `${props.entry.prefix} ` : ''
  const rawText = `${compactTime(props.entry)} ${props.entry.level.toUpperCase().padEnd(5)} ${prefix}${props.entry.message}`
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
