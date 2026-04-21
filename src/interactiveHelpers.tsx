import { setTimeout as delay } from 'node:timers/promises'
import React from 'react'
import { Box, Text } from 'ink'
import type { Root } from './ink.js'

export function getRenderContext() {
  return {
    renderOptions: {
      exitOnCtrlC: false,
    },
  }
}

export async function showSetupScreens(root: Root): Promise<void> {
  root.render(
    <Box flexDirection="column" padding={1}>
      <Text color="cyan">logger</Text>
      <Text dimColor>Preparing mixed log viewer.</Text>
    </Box>,
  )
  await delay(25)
}

export async function renderAndRun(root: Root, deferredPrefetches: Array<() => Promise<void>>): Promise<void> {
  await Promise.allSettled(deferredPrefetches.map((prefetch) => prefetch()))
  await root.waitUntilExit()
}
