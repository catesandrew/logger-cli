import test from 'node:test'
import assert from 'node:assert/strict'
import { getQueryAutocompleteSuggestion } from '../src/lib/queryMode/autocomplete.js'

test('getQueryAutocompleteSuggestion suggests paths from the selected JSON object', () => {
  const suggestion = getQueryAutocompleteSuggestion('.req', {
    request: { method: 'GET' },
    result: { ok: true },
  })

  assert.equal(suggestion, '.request')
})
