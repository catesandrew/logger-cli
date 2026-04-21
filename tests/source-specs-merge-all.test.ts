import test from 'node:test'
import assert from 'node:assert/strict'
import { createSourceSpecs } from '../src/lib/ingest/createSources.js'

test('createSourceSpecs adds a merged source when merge is enabled across mixed source types', () => {
  const specs = createSourceSpecs({
    files: ['a.log'],
    url: 'https://example.com/logs',
    cmd: 'docker logs -f app',
    merge: true,
    maxEntries: 100,
    preserveAnsi: false,
  }, true)

  assert.equal(specs[0]?.id, 'merge-0')
  assert.ok(specs.some((spec) => spec.type === 'file'))
  assert.ok(specs.some((spec) => spec.type === 'url'))
  assert.ok(specs.some((spec) => spec.type === 'cmd'))
})
