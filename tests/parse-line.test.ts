import test from 'node:test'
import assert from 'node:assert/strict'
import { parseLine } from '../src/lib/parse/parseLine.js'

test('parseLine parses plain JSON log lines', () => {
  const parsed = parseLine('{"time":"2026-04-21T19:00:00Z","level":"info","message":"hello"}')
  assert.equal(parsed.kind, 'json')
  assert.equal(parsed.level, 'info')
  assert.equal(parsed.message, 'hello')
  assert.equal(parsed.time, '2026-04-21T19:00:00.000Z')
})

test('parseLine parses prefixed JSON lines', () => {
  const parsed = parseLine('api-1 | {"severity":"warn","msg":"limit soon"}')
  assert.equal(parsed.kind, 'json')
  assert.equal(parsed.prefix, 'api-1')
  assert.equal(parsed.level, 'warn')
  assert.equal(parsed.message, 'limit soon')
})

test('parseLine falls back to plain text', () => {
  const parsed = parseLine('plain text log entry')
  assert.equal(parsed.kind, 'text')
  assert.equal(parsed.message, 'plain text log entry')
})
