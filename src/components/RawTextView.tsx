import React from 'react'
import { Box, Text } from 'ink'

export function RawTextView(props: { text: string }): React.ReactElement {
  return (
    <Box flexDirection="column">
      {props.text.split('\n').map((line, index) => (
        <Text key={`${index}-${line}`}>{line}</Text>
      ))}
    </Box>
  )
}
