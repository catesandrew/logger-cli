import { setTimeout as delay } from 'node:timers/promises'
import process from 'node:process'

export interface InitArtifacts {
  cwd: string
  startupNotes: string[]
  deferredPrefetches: Array<() => Promise<void>>
}

export async function initializeEntrypoint(): Promise<InitArtifacts> {
  await Promise.all([delay(2), delay(2), delay(2)])

  return {
    cwd: process.cwd(),
    startupNotes: [
      'logger shell initialized',
      'ingest and parse layers warmed',
    ],
    deferredPrefetches: [async () => { await delay(1) }],
  }
}
