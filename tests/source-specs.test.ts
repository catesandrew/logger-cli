import test from 'node:test'
import assert from 'node:assert/strict'
import { createSourceSpecs } from '../src/lib/ingest/createSources.js'

test('createSourceSpecs prefers files over stdin', () => {
  const specs = createSourceSpecs({
    files: ['a.log', 'b.log'],
    merge: false,
    maxEntries: 10,
    preserveAnsi: false,
  }, false)
  assert.equal(specs.length, 2)
  assert.equal(specs[0]?.type, 'file')
})

test('createSourceSpecs chooses stdin when no explicit source is provided', () => {
  const specs = createSourceSpecs({
    files: [],
    merge: false,
    maxEntries: 10,
    preserveAnsi: false,
  }, false)
  assert.equal(specs[0]?.type, 'stdin')
})

test('createSourceSpecs adds a synthetic merged tab when merge is enabled with multiple files', () => {
  const specs = createSourceSpecs({
    files: ['a.log', 'b.log'],
    merge: true,
    maxEntries: 10,
    preserveAnsi: false,
  }, true)

  assert.equal(specs[0]?.id, 'merge-0')
  assert.equal(specs.length, 3)
})
