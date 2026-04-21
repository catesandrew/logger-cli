import React from 'react'
import { Box } from 'ink'
import { useVirtualScroll } from '../hooks/useVirtualScroll.js'

export function VirtualSelectableList<T>(props: {
  items: T[]
  offset: number
  viewportSize: number
  renderItem(item: T, index: number): React.ReactNode
}): React.ReactElement {
  const range = useVirtualScroll(props.items.length, props.offset, props.viewportSize)
  const visible = props.items.slice(range.startIndex, range.endIndex)

  return (
    <Box flexDirection="column">
      {visible.map((item, index) => props.renderItem(item, range.startIndex + index))}
    </Box>
  )
}
