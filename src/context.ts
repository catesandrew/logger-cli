import process from 'node:process'

export function getOriginalCwd(): string {
  return process.cwd()
}
