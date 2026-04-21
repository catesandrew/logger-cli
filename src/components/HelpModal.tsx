import React from 'react'
import { Box, Text } from 'ink'

export function HelpModal(): React.ReactElement {
  return (
    <Box flexDirection="column" borderStyle="round" padding={1}>
      <Text color="cyan">logger help</Text>
      <Text>Up/Down or j/k: move selection</Text>
      <Text>PgUp/PgDn: page</Text>
      <Text>Home/End or g/G: jump</Text>
      <Text>Tab / Shift+Tab: switch source tabs</Text>
      <Text>Enter: toggle detail focus</Text>
      <Text>/ : enter filter mode</Text>
      <Text>? in detail: search detail pane</Text>
      <Text>n / N: next / previous detail match</Text>
      <Text>y: copy selected JSON value preview</Text>
      <Text>p: copy selected JSON path</Text>
      <Text>Esc: back</Text>
      <Text>Space: toggle fold on JSON node</Text>
      <Text>R: reverse order</Text>
      <Text>F1 or ?: help</Text>
      <Text>q: quit</Text>
    </Box>
  )
}
