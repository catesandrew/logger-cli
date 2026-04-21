import test from 'node:test'
import assert from 'node:assert/strict'
import { matchesBinding } from '../src/lib/query/keybindings.js'
import type { LoggerConfig } from '../src/types.js'

const config: LoggerConfig = {
  columns: [],
  keybindings: {
    toggleReverse: ['v'],
  },
}

test('matchesBinding uses config overrides when present', () => {
  assert.equal(matchesBinding('toggleReverse', 'v', {}, config), true)
  assert.equal(matchesBinding('toggleReverse', 'R', {}, config), false)
})

test('matchesBinding falls back to defaults when no override is present', () => {
  assert.equal(matchesBinding('openFilter', '/', {}, config), true)
})
