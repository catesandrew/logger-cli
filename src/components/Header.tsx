import React from 'react'
import { Box, Text } from 'ink'
import type { LoggerColumn, SourceSnapshot } from '../types.js'

export function Header(props: {
  sources: SourceSnapshot[]
  activeTabIndex: number
  filteredCount: number
  queryText: string
  columns: LoggerColumn[]
}): React.ReactElement {
  const active = props.sources[props.activeTabIndex]
  const total = active?.total ?? 0
  const jsonCount = active?.jsonCount ?? 0
  const textCount = active?.textCount ?? 0

  return (
    <Box flexDirection="column">
      <Box justifyContent="space-between">
        <Text color="cyan">logger</Text>
        <Text color="gray">
          source:{active?.spec.label ?? 'none'} total:{total} match:{props.filteredCount} json:{jsonCount} text:{textCount}
        </Text>
      </Box>
      {props.queryText ? (
        <Text color="yellow">filter: {props.queryText}</Text>
      ) : null}
      {props.columns.length > 0 ? (
        <Text color="gray">columns: {props.columns.map((column) => `${column.key}=${column.path}`).join(', ')}</Text>
      ) : null}
      <Box gap={1}>
        {props.sources.map((source, index) => (
          <Text
            key={source.spec.id}
            color={index === props.activeTabIndex ? 'black' : 'gray'}
            backgroundColor={index === props.activeTabIndex ? 'cyan' : undefined}
          >
            {source.spec.label}
          </Text>
        ))}
      </Box>
    </Box>
  )
}
