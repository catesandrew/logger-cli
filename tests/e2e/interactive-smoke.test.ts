import test from 'node:test'
import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import path from 'node:path'

const execFileAsync = promisify(execFile)

test('interactive TUI renders under a PTY and exits cleanly', { timeout: 10000 }, async () => {
  const entry = path.resolve(process.cwd(), 'dist/main.js')
  const example = path.resolve(process.cwd(), 'examples/mixed.log')

  const python = [
    'import os, pty, select, subprocess, sys, time',
    `cmd = [${JSON.stringify(process.execPath)}, ${JSON.stringify(entry)}, ${JSON.stringify(example)}]`,
    'master, slave = pty.openpty()',
    'proc = subprocess.Popen(cmd, stdin=slave, stdout=slave, stderr=slave, text=False)',
    'os.close(slave)',
    'time.sleep(0.6)',
    "os.write(master, b'?')",
    'time.sleep(0.3)',
    "os.write(master, b'q')",
    'output = b""',
    'deadline = time.time() + 3',
    'while time.time() < deadline:',
    '    ready, _, _ = select.select([master], [], [], 0.1)',
    '    if not ready:',
    '        if proc.poll() is not None:',
    '            break',
    '        continue',
    '    try:',
    '        chunk = os.read(master, 4096)',
    '    except OSError:',
    '        break',
    '    if not chunk:',
    '        break',
    '    output += chunk',
    'if proc.poll() is None:',
    '    proc.terminate()',
    '    try:',
    '        proc.wait(timeout=2)',
    '    except subprocess.TimeoutExpired:',
    '        proc.kill()',
    'sys.stdout.buffer.write(output)',
  ].join('\n')

  const { stdout } = await execFileAsync('python3', ['-c', python], { maxBuffer: 1024 * 1024 })

  assert.match(stdout, /logger/)
  assert.match(stdout, /mixed\.log/)
  assert.match(stdout, /detail search/)
})
