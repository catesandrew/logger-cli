import { useMemo } from 'react'

export interface VirtualScrollState {
  startIndex: number
  endIndex: number
}

export function useVirtualScroll(total: number, offset: number, viewportSize: number): VirtualScrollState {
  return useMemo(() => {
    const safeViewport = Math.max(viewportSize, 1)
    const startIndex = Math.max(0, Math.min(offset, Math.max(total - safeViewport, 0)))
    const endIndex = Math.min(total, startIndex + safeViewport)
    return { startIndex, endIndex }
  }, [offset, total, viewportSize])
}
