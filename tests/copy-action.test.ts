import test from 'node:test'
import assert from 'node:assert/strict'
import { getJsonTreeCopyValue } from '../src/lib/query/detailTools.js'

test('copy helpers continue to provide path and value payloads for clipboard actions', () => {
  const line = {
    id: '$.request.path',
    depth: 1,
    key: 'path',
    valuePreview: 'path: "/health"',
    collapsible: false,
    collapsed: false,
  }

  assert.equal(getJsonTreeCopyValue(line, 'path'), '$.request.path')
  assert.equal(getJsonTreeCopyValue(line, 'value'), 'path: "/health"')
})
