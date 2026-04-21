import React from 'react'
import { Box } from 'ink'
import { AppStateProvider } from '../state/AppState.js'

export function App(props: {
  initialCwd: string
  startupNotes: string[]
  theme: 'amber' | 'cyan'
  children: React.ReactNode
}): React.ReactElement {
  return (
    <AppStateProvider cwd={props.initialCwd}>
      <Box flexDirection="column">{props.children}</Box>
    </AppStateProvider>
  )
}
