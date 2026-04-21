import React from 'react'
import { App } from './components/App.js'
import { REPL } from './screens/REPL.js'
import type { Root } from './ink.js'
import type { LoggerCliOptions } from './types.js'
import type { InitArtifacts } from './entrypoints/init.js'
import type { QueryEngine } from './QueryEngine.js'

export async function launchRepl(args: {
  root: Root
  options: LoggerCliOptions
  init: InitArtifacts
  queryEngine: QueryEngine
}): Promise<void> {
  args.root.render(
    <App initialCwd={args.init.cwd} startupNotes={args.init.startupNotes} theme="cyan">
      <REPL options={args.options} queryEngine={args.queryEngine} />
    </App>,
  )
}
