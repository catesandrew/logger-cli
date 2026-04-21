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
