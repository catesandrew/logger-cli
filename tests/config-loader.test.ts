import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { loadLoggerConfig } from '../src/lib/config/configLoader.js'

async function makeTempDir(prefix: string): Promise<string> {
  return await fs.mkdtemp(path.join(os.tmpdir(), prefix))
}

test('loadLoggerConfig prefers cwd config over home config', async () => {
  const cwd = await makeTempDir('logger-cwd-')
  const home = await makeTempDir('logger-home-')

  await fs.writeFile(
    path.join(home, '.logger.jsonc'),
    JSON.stringify({ columns: [{ key: 'home', path: '$.home' }] }),
    'utf8',
  )
  await fs.writeFile(
    path.join(cwd, '.logger.jsonc'),
    JSON.stringify({ columns: [{ key: 'cwd', path: '$.cwd' }] }),
    'utf8',
  )

  const config = await loadLoggerConfig({ cwd, home })
  assert.equal(config.columns[0]?.key, 'cwd')
})

test('loadLoggerConfig strips line comments from jsonc', async () => {
  const cwd = await makeTempDir('logger-jsonc-')

  await fs.writeFile(
    path.join(cwd, '.logger.jsonc'),
    '{\n  // comment\n  "columns": [{"key":"client","path":"$.client"}]\n}\n',
    'utf8',
  )

  const config = await loadLoggerConfig({ cwd, home: cwd })
  assert.equal(config.columns[0]?.path, '$.client')
})
