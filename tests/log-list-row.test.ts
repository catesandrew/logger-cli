import test from 'node:test'
import assert from 'node:assert/strict'
import type { LogEntry } from '../src/types.js'
import { getJsonPathValue } from '../src/lib/query/jsonPath.js'

const entry: LogEntry = {
  id: 1,
  sourceId: 'api',
  raw: '{"message":"hello","client":"203.0.113.10"}',
  kind: 'json',
  parsed: { message: 'hello', client: '203.0.113.10' },
  level: 'info',
  levelRaw: 'info',
  message: 'hello',
  time: '2026-04-21T19:00:00.000Z',
}

test('JSONPath-like column extraction resolves values used by LogListRow', () => {
  const value = getJsonPathValue(entry.parsed, '$.client')
  assert.equal(value, '203.0.113.10')
})
