import test from 'node:test'
import assert from 'node:assert/strict'
import { RingBuffer } from '../src/lib/ingest/ringBuffer.js'

test('RingBuffer keeps only the configured max number of items', () => {
  const buffer = new RingBuffer<number>(3)
  buffer.push(1)
  buffer.push(2)
  buffer.push(3)
  buffer.push(4)

  assert.deepEqual(buffer.toArray(), [2, 3, 4])
  assert.deepEqual(buffer.toArray(true), [4, 3, 2])
})
