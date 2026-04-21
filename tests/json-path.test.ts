import test from 'node:test'
import assert from 'node:assert/strict'
import { getJsonPathValue } from '../src/lib/query/jsonPath.js'

test('getJsonPathValue resolves simple object paths', () => {
  const value = getJsonPathValue(
    {
      request: {
        path: '/health',
      },
    },
    '$.request.path',
  )

  assert.equal(value, '/health')
})

test('getJsonPathValue resolves array indices', () => {
  const value = getJsonPathValue(
    {
      tags: ['a', 'b', 'c'],
    },
    '$.tags[1]',
  )

  assert.equal(value, 'b')
})

test('getJsonPathValue returns undefined for missing paths', () => {
  const value = getJsonPathValue({ request: {} }, '$.request.method')
  assert.equal(value, undefined)
})
