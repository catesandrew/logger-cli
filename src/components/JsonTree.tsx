import React, { useMemo } from 'react'
import { Box, Text } from 'ink'
import type { JsonTreeLine } from '../types.js'

function formatScalar(value: unknown): string {
  if (typeof value === 'string') return JSON.stringify(value)
  if (value === null) return 'null'
  if (typeof value === 'object') return Array.isArray(value) ? '[...]' : '{...}'
  return String(value)
}

function buildTreeLines(
  value: unknown,
  foldState: Set<string>,
  path = '$',
  depth = 0,
  key?: string,
): JsonTreeLine[] {
  const id = path
  const isObject = value !== null && typeof value === 'object'
  const collapsible = isObject
  const collapsed = collapsible && foldState.has(id)
  const preview =
    key !== undefined
      ? `${key}: ${formatScalar(value)}`
      : formatScalar(value)

  const lines: JsonTreeLine[] = [
    {
      id,
      depth,
      key,
      valuePreview: preview,
      collapsible,
      collapsed,
    },
  ]

  if (!isObject || collapsed) {
    return lines
  }

  if (Array.isArray(value)) {
    value.forEach((child, index) => {
      lines.push(...buildTreeLines(child, foldState, `${path}[${index}]`, depth + 1, `[${index}]`))
    })
    return lines
  }

  for (const [childKey, childValue] of Object.entries(value as Record<string, unknown>)) {
    lines.push(...buildTreeLines(childValue, foldState, `${path}.${childKey}`, depth + 1, childKey))
  }

  return lines
}

export function JsonTree(props: {
  value: unknown
  foldState: Set<string>
  selectedIndex: number
}): React.ReactElement {
  const lines = useMemo(() => buildTreeLines(props.value, props.foldState), [props.value, props.foldState])

  return (
    <Box flexDirection="column">
      {lines.map((line, index) => (
        <Text
          key={line.id}
          color={index === props.selectedIndex ? 'black' : 'white'}
          backgroundColor={index === props.selectedIndex ? 'cyan' : undefined}
        >
          {' '.repeat(line.depth * 2)}
          {line.collapsible ? (line.collapsed ? '▶ ' : '▼ ') : '  '}
          {line.valuePreview}
        </Text>
      ))}
    </Box>
  )
}
