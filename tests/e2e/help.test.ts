import test from 'node:test'
import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import path from 'node:path'

const execFileAsync = promisify(execFile)

test('built cli shows help', async () => {
  const entry = path.resolve(process.cwd(), 'dist/main.js')
  const { stdout } = await execFileAsync(process.execPath, [entry, '--help'])
  assert.match(stdout, /Interactive mixed JSON\/text log viewer/)
  assert.match(stdout, /--url/)
  assert.match(stdout, /--cmd/)
})
