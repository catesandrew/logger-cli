import test from 'node:test'
import assert from 'node:assert/strict'
import { evaluateQuery } from '../src/lib/queryMode/evaluateQuery.js'

test('evaluateQuery supports identity and simple path fallback mode', () => {
  const value = { user: { name: 'alice' }, items: ['a', 'b'] }

  assert.deepEqual(evaluateQuery(value, '.'), value)
  assert.equal(evaluateQuery(value, '.user.name'), 'alice')
  assert.equal(evaluateQuery(value, '.items[1]'), 'b')
})
