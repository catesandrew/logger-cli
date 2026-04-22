import React from 'react'
import { Box, Text } from 'ink'
import { JsonTree } from './JsonTree.js'
import { RawTextView } from './RawTextView.js'
import type { QueryResultItem } from '../types.js'

export function QueryResultView(props: {
  items: QueryResultItem[]
  selectedIndex: number
  foldState: Set<string>
  selectedTreeIndex: number
}): React.ReactElement {
  const selected = props.items[props.selectedIndex]

  return (
    <Box flexDirection="column">
      <Text color="green">{props.items.length > 1 ? `results: ${props.items.length}` : 'result'}</Text>
      {!selected ? (
        <Text color="gray">No query result</Text>
      ) : selected.result && typeof selected.result === 'object' ? (
        <JsonTree
          value={selected.result}
          foldState={props.foldState}
          selectedIndex={props.selectedTreeIndex}
        />
      ) : (
        <RawTextView text={String(selected.result)} />
      )}
    </Box>
  )
}
