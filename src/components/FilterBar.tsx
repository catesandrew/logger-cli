import React from 'react'
import { Box, Text } from 'ink'
import TextInput from 'ink-text-input'

export function FilterBar(props: {
  value: string
  onChange(value: string): void
  onSubmit(value: string): void
}): React.ReactElement {
  return (
    <Box borderStyle="round" paddingX={1}>
      <Text color="cyan">/ </Text>
      <TextInput value={props.value} onChange={props.onChange} onSubmit={props.onSubmit} />
    </Box>
  )
}
