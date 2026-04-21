import test from 'node:test'
import assert from 'node:assert/strict'
import { renderMainLine } from '../src/lib/format/mainLineTemplate.js'
import type { LogEntry, LoggerConfig } from '../src/types.js'

const entry: LogEntry = {
  id: 1,
  sourceId: 'api',
  raw: '{"message":"hello #{user}","extra_data":{"user":"alice"}}',
  kind: 'json',
  parsed: {
    message: 'hello #{user}',
    extra_data: { user: 'alice' },
  },
  level: 'info',
  levelRaw: 'info',
  message: 'hello #{user}',
  time: '2026-04-21T19:00:00.000Z',
}

const config: LoggerConfig = {
  columns: [],
  keybindings: {},
  mainLineTemplate: '{{uppercase level}} {{message}}',
  placeholderFormat: '#{key}',
  contextPath: 'extra_data',
  levelMap: {},
}

test('renderMainLine applies template helpers and placeholder substitution', () => {
  const line = renderMainLine(entry, config)
  assert.match(line, /INFO hello alice/)
})
