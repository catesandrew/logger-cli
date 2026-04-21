import test from 'node:test'
import assert from 'node:assert/strict'
import { createMergedEntries } from '../src/query.js'
import type { LogEntry } from '../src/types.js'

const sourceA: LogEntry[] = [
  { id: 1, sourceId: 'a', raw: 'a1', kind: 'text', level: 'info', message: 'a1', timestampMs: 20 },
  { id: 2, sourceId: 'a', raw: 'a2', kind: 'text', level: 'info', message: 'a2', timestampMs: 30 },
]

const sourceB: LogEntry[] = [
  { id: 3, sourceId: 'b', raw: 'b1', kind: 'text', level: 'info', message: 'b1', timestampMs: 10 },
  { id: 4, sourceId: 'b', raw: 'b2', kind: 'text', level: 'info', message: 'b2', timestampMs: 40 },
]

test('createMergedEntries can preserve source grouping', () => {
  const merged = createMergedEntries(
    [
      { sourceId: 'a', entries: sourceA },
      { sourceId: 'b', entries: sourceB },
    ],
    false,
    'source',
  )

  assert.deepEqual(merged.map((entry) => entry.id), [1, 2, 3, 4])
})
