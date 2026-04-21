import React from 'react'
import { Box, Text } from 'ink'
import { stripAnsi } from '../lib/query/ansi.js'
import { splitHighlightedText } from '../lib/query/highlight.js'

export function RawTextView(props: {
  text: string
  searchText?: string
  preserveAnsi?: boolean
}): React.ReactElement {
  const displayText = props.preserveAnsi ? props.text : stripAnsi(props.text)

  return (
    <Box flexDirection="column">
      {displayText.split('\n').map((line, index) => (
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
