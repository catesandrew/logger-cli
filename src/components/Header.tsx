import React from 'react'
import { Box, Text } from 'ink'
import type { SourceSnapshot } from '../types.js'

export function Header(props: {
  sources: SourceSnapshot[]
  activeTabIndex: number
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
          source:{active?.spec.label ?? 'none'} total:{total} json:{jsonCount} text:{textCount}
        </Text>
      </Box>
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
