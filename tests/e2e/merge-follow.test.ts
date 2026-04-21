import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import http from 'node:http'
import os from 'node:os'
import path from 'node:path'
import { QueryEngine } from '../../src/QueryEngine.js'

async function makeTempDir(prefix: string): Promise<string> {
  return await fs.mkdtemp(path.join(os.tmpdir(), prefix))
}

test('query engine can merge file, url, and cmd sources', async () => {
  const dir = await makeTempDir('logger-merge-')
  const file = path.join(dir, 'app.log')
  await fs.writeFile(file, '{"time":"2026-04-21T19:00:00Z","message":"from-file"}\n', 'utf8')

  const server = http.createServer((_req, res) => {
    res.write('{"time":"2026-04-21T19:00:01Z","message":"from-url"}\n')
    res.end()
  })
  await new Promise<void>((resolve) => server.listen(0, resolve))
  const address = server.address()
  const port = typeof address === 'object' && address ? address.port : 0

  const engine = new QueryEngine()
  const session = await engine.start({
    files: [file],
    url: `http://127.0.0.1:${port}`,
    cmd: "printf '{\"time\":\"2026-04-21T19:00:02Z\",\"message\":\"from-cmd\"}\\n'",
    merge: true,
    maxEntries: 100,
    preserveAnsi: false,
  })

  await new Promise((resolve) => setTimeout(resolve, 250))

  const merged = session.getEntries('merge-0', false)
  session.stop()
  server.close()

  assert.equal(merged.length, 3)
  assert.deepEqual(merged.map((entry) => entry.message), ['from-file', 'from-url', 'from-cmd'])
})

test('query engine follows appended file lines through the session', async () => {
  const dir = await makeTempDir('logger-follow-session-')
  const file = path.join(dir, 'app.log')
  await fs.writeFile(file, '{"message":"first"}\n', 'utf8')

  const engine = new QueryEngine()
  const session = await engine.start({
    files: [file],
    merge: false,
    maxEntries: 100,
    preserveAnsi: false,
  })

  await new Promise((resolve) => setTimeout(resolve, 50))
  await fs.appendFile(file, '{"message":"second"}\n', 'utf8')
  await new Promise((resolve) => setTimeout(resolve, 180))

  const entries = session.getEntries('file-0', false)
  session.stop()

  assert.deepEqual(entries.map((entry) => entry.message), ['first', 'second'])
})
