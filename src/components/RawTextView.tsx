import React from 'react'
import { Box, Text } from 'ink'
import { splitHighlightedText } from '../lib/query/highlight.js'

export function RawTextView(props: { text: string; searchText?: string }): React.ReactElement {
  return (
    <Box flexDirection="column">
      {props.text.split('\n').map((line, index) => (
        <Text key={`${index}-${line}`}>
          {splitHighlightedText(line, props.searchText ?? '').segments.map((segment, segmentIndex) => (
            <Text
              key={`${index}-${segmentIndex}`}
              color={segment.highlighted ? 'yellow' : undefined}
            >
              {segment.text}
            </Text>
          ))}
        </Text>
      ))}
    </Box>
  )
}
