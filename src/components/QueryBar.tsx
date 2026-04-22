import React from 'react'
import { Box, Text } from 'ink'
import TextInput from 'ink-text-input'

export function QueryBar(props: {
  value: string
  suggestion?: string | null
  focusGlyph: string
  blurGlyph: string
  onChange(value: string): void
  onSubmit(value: string): void
}): React.ReactElement {
  const suffix = props.suggestion && props.suggestion.startsWith(props.value)
    ? props.suggestion.slice(props.value.length)
    : ''

  return (
    <Box borderStyle="round" paddingX={1}>
      <Text color="green">{props.focusGlyph} </Text>
      <TextInput value={props.value} onChange={props.onChange} onSubmit={props.onSubmit} />
      {suffix ? <Text color="gray">{suffix}</Text> : <Text color="gray">{props.blurGlyph}</Text>}
    </Box>
  )
}
