export interface HighlightSegment {
  text: string
  highlighted: boolean
}

export interface HighlightResult {
  segments: HighlightSegment[]
  matchCount: number
}

export function splitHighlightedText(text: string, query: string): HighlightResult {
  if (!query) {
    return {
      segments: [{ text, highlighted: false }],
      matchCount: 0,
    }
  }

  const segments: HighlightSegment[] = []
  const haystack = text.toLowerCase()
  const needle = query.toLowerCase()
  let cursor = 0
  let matchCount = 0

  while (cursor < text.length) {
    const index = haystack.indexOf(needle, cursor)
    if (index < 0) {
      segments.push({ text: text.slice(cursor), highlighted: false })
      break
    }
    if (index > cursor) {
      segments.push({ text: text.slice(cursor, index), highlighted: false })
    }
    segments.push({ text: text.slice(index, index + needle.length), highlighted: true })
    matchCount += 1
    cursor = index + needle.length
  }

  return {
    segments: segments.filter((segment) => segment.text.length > 0),
    matchCount,
  }
}
