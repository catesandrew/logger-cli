import { useEffect, useState } from 'react'

export function useTerminalSize(): { columns: number; rows: number } {
  const [size, setSize] = useState({
    columns: process.stdout.columns ?? 120,
    rows: process.stdout.rows ?? 32,
  })

  useEffect(() => {
    function updateSize() {
      setSize({
        columns: process.stdout.columns ?? 120,
        rows: process.stdout.rows ?? 32,
      })
    }

    process.stdout.on('resize', updateSize)
    return () => {
      process.stdout.off('resize', updateSize)
    }
  }, [])

  return size
}
