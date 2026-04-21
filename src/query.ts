import type { LogEntry } from './types.js'

export function getBottomIndex(length: number, reverse: boolean): number {
  if (length === 0) {
    return 0
  }
  return reverse ? 0 : length - 1
}

export function shouldFollowSelection(selectedIndex: number, length: number, reverse: boolean): boolean {
  if (length === 0) {
    return true
  }
  return selectedIndex === getBottomIndex(length, reverse)
}

export function clampIndex(index: number, length: number): number {
  if (length <= 0) {
    return 0
  }
  return Math.max(0, Math.min(index, length - 1))
}

export function mergeEntriesByTime(entries: LogEntry[], reverse: boolean): LogEntry[] {
  const sorted = [...entries].sort((left, right) => {
    const leftTime = left.timestampMs ?? Number.MAX_SAFE_INTEGER
    const rightTime = right.timestampMs ?? Number.MAX_SAFE_INTEGER
    if (leftTime !== rightTime) {
      return leftTime - rightTime
    }
    return left.id - right.id
  })

  return reverse ? sorted.reverse() : sorted
}

export function createMergedEntries(entriesBySource: LogEntry[][], reverse: boolean): LogEntry[] {
  return mergeEntriesByTime(entriesBySource.flat(), reverse)
}
