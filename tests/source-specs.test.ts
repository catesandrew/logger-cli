import test from 'node:test'
import assert from 'node:assert/strict'
import { createSourceSpecs } from '../src/lib/ingest/createSources.js'

test('createSourceSpecs prefers files over stdin', () => {
  const specs = createSourceSpecs({
    files: ['a.log', 'b.log'],
    maxEntries: 10,
    preserveAnsi: false,
  }, false)
  assert.equal(specs.length, 2)
  assert.equal(specs[0]?.type, 'file')
})

test('createSourceSpecs chooses stdin when no explicit source is provided', () => {
  const specs = createSourceSpecs({
    files: [],
    maxEntries: 10,
    preserveAnsi: false,
  }, false)
  assert.equal(specs[0]?.type, 'stdin')
})
