import process from 'node:process'

const EXTRA_ROWS = 100

export function createInkOutputProxy(
  stdout: NodeJS.WriteStream = process.stdout,
): NodeJS.WriteStream {
  const proxy = Object.create(stdout) as NodeJS.WriteStream

  Object.defineProperty(proxy, 'rows', {
    get() {
      return (stdout.rows ?? 24) + EXTRA_ROWS
    },
  })

  Object.defineProperty(proxy, 'columns', {
    get() {
      return stdout.columns
    },
  })

  return proxy
}
