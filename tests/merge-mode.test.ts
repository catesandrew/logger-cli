import test from 'node:test'
import assert from 'node:assert/strict'
import { mergeEntriesByTime } from '../src/query.js'
import type { LogEntry } from '../src/types.js'

const entries: LogEntry[] = [
  {
    id: 1,
    sourceId: 'a',
    raw: 'a',
    kind: 'text',
    level: 'info',
    message: 'a',
    timestampMs: 20,
  },
  {
    id: 2,
    sourceId: 'b',
    raw: 'b',
    kind: 'text',
    level: 'info',
    message: 'b',
    timestampMs: 10,
  },
  {
    id: 3,
    sourceId: 'c',
    raw: 'c',
    kind: 'text',
    level: 'info',
    message: 'c',
  },
]

test('mergeEntriesByTime sorts by timestamp then id', () => {
  const merged = mergeEntriesByTime(entries, false)
  assert.deepEqual(merged.map((entry) => entry.id), [2, 1, 3])
})

test('mergeEntriesByTime reverses ordering when requested', () => {
  const merged = mergeEntriesByTime(entries, true)
  assert.deepEqual(merged.map((entry) => entry.id), [3, 1, 2])
})
