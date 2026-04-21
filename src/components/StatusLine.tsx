import React from 'react'
import { Box, Text } from 'ink'
import { useAppState } from '../state/AppState.js'

export function StatusLine(): React.ReactElement {
  const cwd = useAppState((state) => state.cwd)
  const status = useAppState((state) => state.statusLine)
  const follow = useAppState((state) => state.follow)
  const reverse = useAppState((state) => state.reverse)

  return (
    <Box justifyContent="space-between">
      <Text color="gray">{cwd}</Text>
      <Text color="cyan">
        {status} | follow:{follow ? 'on' : 'off'} | reverse:{reverse ? 'on' : 'off'}
      </Text>
    </Box>
  )
}
