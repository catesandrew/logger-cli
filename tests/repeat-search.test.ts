import test from 'node:test'
import assert from 'node:assert/strict'
import { findJsonTreeMatch, findTextMatchWrapped } from '../src/lib/query/detailTools.js'
import type { JsonTreeLine } from '../src/types.js'

const lines: JsonTreeLine[] = [
  { id: '$', depth: 0, valuePreview: '{...}', collapsible: true, collapsed: false },
  { id: '$.message', depth: 1, key: 'message', valuePreview: 'message: "alpha"', collapsible: false, collapsed: false },
  { id: '$.request.path', depth: 1, key: 'path', valuePreview: 'path: "/health"', collapsible: false, collapsed: false },
  { id: '$.error.message', depth: 1, key: 'message', valuePreview: 'message: "beta"', collapsible: false, collapsed: false },
]

test('findJsonTreeMatch finds later matches when given a later start index', () => {
  assert.equal(findJsonTreeMatch(lines, 'message', 0), 1)
  assert.equal(findJsonTreeMatch(lines, 'message', 2), 3)
})

test('findTextMatchWrapped supports forward and wrapped backward search', () => {
  const text = 'alpha beta gamma beta'

  assert.deepEqual(findTextMatchWrapped(text, 'beta', 0, 'forward'), {
    index: 6,
    wrapped: false,
  })

  assert.deepEqual(findTextMatchWrapped(text, 'beta', 4, 'backward'), {
    index: 17,
    wrapped: true,
  })
})
