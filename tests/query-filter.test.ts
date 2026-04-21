import test from 'node:test'
import assert from 'node:assert/strict'
import { parseQuery, matchesQuery } from '../src/lib/query/filter.js'
import type { LogEntry } from '../src/types.js'

const baseEntry: LogEntry = {
  id: 1,
  sourceId: 'api',
  raw: '{"level":"warn","message":"rate limit nearing threshold","request":{"path":"/health"}}',
  kind: 'json',
  parsed: {
    level: 'warn',
    message: 'rate limit nearing threshold',
    request: { path: '/health' },
  },
  level: 'warn',
  levelRaw: 'warn',
  message: 'rate limit nearing threshold',
}

test('parseQuery parses bare substring terms and key:value terms', () => {
  const parsed = parseQuery('warn request.path:/health threshold')

  assert.deepEqual(parsed, [
    { type: 'substring', value: 'warn' },
    { type: 'field', field: 'request.path', operator: ':', value: '/health' },
    { type: 'substring', value: 'threshold' },
  ])
})

test('matchesQuery applies AND semantics across query terms', () => {
  const query = parseQuery('warn request.path:/health')
  assert.equal(matchesQuery(baseEntry, query), true)
  assert.equal(matchesQuery(baseEntry, parseQuery('warn request.path:/metrics')), false)
})

test('matchesQuery supports kind and source filters', () => {
  assert.equal(matchesQuery(baseEntry, parseQuery('kind:json source:api')), true)
  assert.equal(matchesQuery(baseEntry, parseQuery('kind:text')), false)
})

test('matchesQuery supports field substring operator', () => {
  assert.equal(matchesQuery(baseEntry, parseQuery('message~threshold')), true)
  assert.equal(matchesQuery(baseEntry, parseQuery('message~panic')), false)
})
