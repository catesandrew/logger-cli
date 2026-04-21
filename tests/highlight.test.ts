import test from 'node:test'
import assert from 'node:assert/strict'
import { splitHighlightedText } from '../src/lib/query/highlight.js'

test('splitHighlightedText returns match segments and count', () => {
  const result = splitHighlightedText('message: "alpha beta"', 'beta')

  assert.equal(result.matchCount, 1)
  assert.deepEqual(result.segments, [
    { text: 'message: "alpha ', highlighted: false },
    { text: 'beta', highlighted: true },
    { text: '"', highlighted: false },
  ])
})

test('splitHighlightedText is case-insensitive', () => {
  const result = splitHighlightedText('Error: Timeout', 'timeout')
  assert.equal(result.matchCount, 1)
})
