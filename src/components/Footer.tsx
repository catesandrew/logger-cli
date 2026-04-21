import React from 'react'
import { Box, Text } from 'ink'
import type { PaneFocus } from '../types.js'

export function Footer(props: {
  follow: boolean
  paneFocus: PaneFocus
}): React.ReactElement {
  return (
    <Box justifyContent="space-between">
      <Text color="gray">
        j/k or arrows move · Enter detail · Esc back · Space fold · Tab tabs · R reverse · F1 help · q quit
      </Text>
      <Text color="yellow">
        focus:{props.paneFocus} · follow:{props.follow ? 'on' : 'off'}
      </Text>
    </Box>
  )
}
