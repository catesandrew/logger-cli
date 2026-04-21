import test from 'node:test'
import assert from 'node:assert/strict'
import { parseQuery, matchesQuery } from '../src/lib/query/filter.js'
import type { LogEntry } from '../src/types.js'

const jsonEntry: LogEntry = {
  id: 1,
  sourceId: 'api',
  raw: '{"request":{"method":"GET"},"span":[{"name":"db"},{"name":"http"}],"latency":42,"level":"warn","message":"request failed","extra_data":{"user":"alice"}}',
  kind: 'json',
  parsed: {
    request: { method: 'GET' },
    span: [{ name: 'db' }, { name: 'http' }],
    latency: 42,
    level: 'warn',
    message: 'request failed',
    extra_data: { user: 'alice' },
  },
  level: 'warn',
  levelRaw: 'warn',
  message: 'request failed',
}

const textEntry: LogEntry = {
  id: 2,
  sourceId: 'plain',
  raw: 'plain text error happened',
  kind: 'text',
  level: 'unknown',
  message: 'plain text error happened',
}

test('advanced filter supports equality and inequality', () => {
  assert.equal(matchesQuery(jsonEntry, parseQuery('request.method = "GET"')), true)
  assert.equal(matchesQuery(jsonEntry, parseQuery('request.method != "POST"')), true)
})

test('advanced filter supports numeric comparisons', () => {
  assert.equal(matchesQuery(jsonEntry, parseQuery('latency >= 40 and latency < 100')), true)
})

test('advanced filter supports substring, wildcard, and regex', () => {
  assert.equal(matchesQuery(jsonEntry, parseQuery('message ~= "failed"')), true)
  assert.equal(matchesQuery(jsonEntry, parseQuery('message like "request*"')), true)
  assert.equal(matchesQuery(jsonEntry, parseQuery('message ~~= "request\\s+failed"')), true)
})

test('advanced filter supports exists, set membership, optional fields, and boolean grouping', () => {
  assert.equal(matchesQuery(jsonEntry, parseQuery('exists(.request.method)')), true)
  assert.equal(matchesQuery(jsonEntry, parseQuery('request.method in ("GET","POST")')), true)
  assert.equal(matchesQuery(jsonEntry, parseQuery('.missing? = "x"')), true)
  assert.equal(matchesQuery(jsonEntry, parseQuery('(request.method = "GET" and not level = "info") or span.[1].name = "http"')), true)
})

test('advanced filter supports array wildcard paths', () => {
  assert.equal(matchesQuery(jsonEntry, parseQuery('span.[].name = "db"')), true)
})

test('advanced filter works for text entries through message fields', () => {
  assert.equal(matchesQuery(textEntry, parseQuery('message ~= "error"')), true)
})
