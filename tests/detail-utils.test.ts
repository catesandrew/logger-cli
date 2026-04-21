import test from 'node:test'
import assert from 'node:assert/strict'
import { findJsonTreeMatch, getJsonTreeCopyValue } from '../src/lib/query/detailTools.js'
import type { JsonTreeLine } from '../src/types.js'

const lines: JsonTreeLine[] = [
  { id: '$', depth: 0, valuePreview: '{...}', collapsible: true, collapsed: false },
  { id: '$.request', depth: 1, key: 'request', valuePreview: 'request: {...}', collapsible: true, collapsed: false },
  { id: '$.request.path', depth: 2, key: 'path', valuePreview: 'path: "/health"', collapsible: false, collapsed: false },
]

test('findJsonTreeMatch finds the next matching line by preview text', () => {
  assert.equal(findJsonTreeMatch(lines, 'health', 0), 2)
})

test('getJsonTreeCopyValue returns path or preview based on mode', () => {
  assert.equal(getJsonTreeCopyValue(lines[2], 'path'), '$.request.path')
  assert.equal(getJsonTreeCopyValue(lines[2], 'value'), 'path: "/health"')
})
