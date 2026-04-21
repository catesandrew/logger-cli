import test from 'node:test'
import assert from 'node:assert/strict'
import { LineSplitter } from '../src/lib/ingest/lineSplitter.js'

test('LineSplitter carries remainder across chunks', () => {
  const splitter = new LineSplitter()
  assert.deepEqual(splitter.push('one\ntw'), ['one'])
  assert.deepEqual(splitter.push('o\nthree'), ['two'])
  assert.deepEqual(splitter.flush(), ['three'])
})
