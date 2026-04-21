import test from 'node:test'
import assert from 'node:assert/strict'
import { formatSourceLabel } from '../src/lib/query/sourceLabel.js'

test('formatSourceLabel prefixes source labels in merged mode', () => {
  assert.equal(formatSourceLabel(true, 'api.log', 'server started'), '[api.log] server started')
})

test('formatSourceLabel leaves labels unchanged outside merged mode', () => {
  assert.equal(formatSourceLabel(false, 'api.log', 'server started'), 'server started')
})
