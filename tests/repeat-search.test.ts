import test from 'node:test'
import assert from 'node:assert/strict'
import { findJsonTreeMatch } from '../src/lib/query/detailTools.js'
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
