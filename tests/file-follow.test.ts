import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { createFileSource } from '../src/lib/ingest/fileSource.js'
import type { SourceSpec } from '../src/types.js'

async function makeTempDir(prefix: string): Promise<string> {
  return await fs.mkdtemp(path.join(os.tmpdir(), prefix))
}

test('file source follows appended lines', async () => {
  const dir = await makeTempDir('logger-follow-')
  const file = path.join(dir, 'app.log')
  await fs.writeFile(file, 'one\n', 'utf8')

  const lines: string[] = []
  const spec: SourceSpec = {
    id: 'file-1',
    label: 'app.log',
    type: 'file',
    location: file,
  }

  const subscription = createFileSource(spec, {
    onLine(line) {
      lines.push(line)
    },
    onError(error) {
      throw error
    },
    onEnd() {},
  })

  await new Promise((resolve) => setTimeout(resolve, 50))
  await fs.appendFile(file, 'two\n', 'utf8')
  await new Promise((resolve) => setTimeout(resolve, 150))
  subscription.stop()

  assert.deepEqual(lines, ['one', 'two'])
})
