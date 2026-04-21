import React from 'react'
import { Box, Text } from 'ink'
import type { PaneFocus, ReplMode } from '../types.js'

export function Footer(props: {
  follow: boolean
  paneFocus: PaneFocus
  replMode: ReplMode
}): React.ReactElement {
  return (
    <Box justifyContent="space-between">
      <Text color="gray">
        / filter · ? detail search · y copy value · p copy path · j/k move · Enter detail · Esc back · Space fold · Tab tabs · R reverse · F1 help · q quit
      </Text>
      <Text color="yellow">
        mode:{props.replMode} · focus:{props.paneFocus} · follow:{props.follow ? 'on' : 'off'}
      </Text>
    </Box>
  )
}
