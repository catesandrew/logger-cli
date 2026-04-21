import React, { useEffect, useMemo, useState } from 'react'
import { Box, Text, useApp, useInput } from 'ink'
import { Header } from '../components/Header.js'
import { Footer } from '../components/Footer.js'
import { HelpModal } from '../components/HelpModal.js'
import { JsonTree } from '../components/JsonTree.js'
import { LogListRow } from '../components/LogListRow.js'
import { RawTextView } from '../components/RawTextView.js'
import { StatusLine } from '../components/StatusLine.js'
import { VirtualSelectableList } from '../components/VirtualSelectableList.js'
import { useAppState, useAppStateStore } from '../state/AppState.js'
import { useTerminalSize } from '../hooks/useTerminalSize.js'
import { QueryEngine, type LoggerSession } from '../QueryEngine.js'
import { clampIndex, getBottomIndex, shouldFollowSelection } from '../query.js'
import type { JsonTreeLine, LoggerCliOptions, LogEntry } from '../types.js'

function flattenJson(value: unknown, foldState: Set<string>, path = '$', depth = 0, key?: string): JsonTreeLine[] {
  const isObject = value !== null && typeof value === 'object'
  const collapsible = isObject
  const collapsed = collapsible && foldState.has(path)
  const preview =
    key !== undefined
      ? `${key}: ${typeof value === 'string' ? JSON.stringify(value) : Array.isArray(value) ? '[...]' : value === null ? 'null' : isObject ? '{...}' : String(value)}`
      : typeof value === 'string'
        ? JSON.stringify(value)
        : Array.isArray(value)
          ? '[...]'
          : value === null
            ? 'null'
            : isObject
              ? '{...}'
              : String(value)

  const lines: JsonTreeLine[] = [{
    id: path,
    depth,
    key,
    valuePreview: preview,
    collapsible,
    collapsed,
  }]

  if (!isObject || collapsed) {
    return lines
  }

  if (Array.isArray(value)) {
    value.forEach((child, index) => {
      lines.push(...flattenJson(child, foldState, `${path}[${index}]`, depth + 1, `[${index}]`))
    })
    return lines
  }

  for (const [childKey, childValue] of Object.entries(value as Record<string, unknown>)) {
    lines.push(...flattenJson(childValue, foldState, `${path}.${childKey}`, depth + 1, childKey))
  }

  return lines
}

export function REPL(props: {
  options: LoggerCliOptions
  queryEngine: QueryEngine
}): React.ReactElement {
  const { exit } = useApp()
  const store = useAppStateStore()
  const activeTabIndex = useAppState((state) => state.activeTabIndex)
  const selectedIndex = useAppState((state) => state.selectedIndex)
  const paneFocus = useAppState((state) => state.paneFocus)
  const helpOpen = useAppState((state) => state.helpOpen)
  const reverse = useAppState((state) => state.reverse)
  const follow = useAppState((state) => state.follow)
  const detailCursorIndex = useAppState((state) => state.detailCursorIndex)
  const detailViewMode = useAppState((state) => state.detailViewMode)
  const terminal = useTerminalSize()
  const [session, setSession] = useState<LoggerSession | null>(null)
  const [version, setVersion] = useState(0)
  const [foldState, setFoldState] = useState<Set<string>>(new Set())
  const sessionRef = React.useRef<LoggerSession | null>(null)

  useEffect(() => {
    let mounted = true
    void props.queryEngine.start(props.options).then((nextSession) => {
      if (!mounted) {
        nextSession.stop()
        return
      }
      sessionRef.current = nextSession
      setSession(nextSession)
      store.setState({
        statusLine: nextSession.specs.length > 0 ? 'Streaming logs' : 'No source configured. Pass files, stdin, --url, or --cmd.',
      })
      return nextSession.subscribe(() => {
        setVersion((current) => current + 1)
      })
    })

    return () => {
      mounted = false
      sessionRef.current?.stop()
    }
  }, [])

  const snapshot = session?.getSnapshot() ?? { version: 0, sources: [] }
  const activeSource = snapshot.sources[activeTabIndex]
  const activeEntries = useMemo(
    () => (activeSource ? session?.getEntries(activeSource.spec.id, reverse) ?? [] : []),
    [session, activeSource?.spec.id, reverse, version],
  )

  useEffect(() => {
    const bottomIndex = getBottomIndex(activeEntries.length, reverse)
    if (follow) {
      store.setState((current) => ({
        ...current,
        selectedIndex: bottomIndex,
      }))
    } else {
      store.setState((current) => ({
        ...current,
        selectedIndex: clampIndex(current.selectedIndex, activeEntries.length),
      }))
    }
  }, [activeEntries.length, reverse, follow, store])

  const selectedEntry = activeEntries[clampIndex(selectedIndex, activeEntries.length)]
  const treeLines = useMemo(
    () => (selectedEntry?.kind === 'json' ? flattenJson(selectedEntry.parsed, foldState) : []),
    [selectedEntry, foldState],
  )

  function moveSelection(delta: number) {
    store.setState((current) => {
      const nextIndex = clampIndex(current.selectedIndex + delta, activeEntries.length)
      return {
        ...current,
        selectedIndex: nextIndex,
        follow: shouldFollowSelection(nextIndex, activeEntries.length, current.reverse),
      }
    })
  }

  function jumpSelection(target: number) {
    const nextIndex = clampIndex(target, activeEntries.length)
    store.setState((current) => ({
      ...current,
      selectedIndex: nextIndex,
      follow: shouldFollowSelection(nextIndex, activeEntries.length, current.reverse),
    }))
  }

  useInput((input, key) => {
    const extendedKey = key as typeof key & { f1?: boolean; home?: boolean; end?: boolean }

    if (helpOpen) {
      if (key.escape || input === 'q' || extendedKey.f1 || input === '?') {
        store.setState({ helpOpen: false })
      }
      return
    }

    if (extendedKey.f1 || input === '?') {
      store.setState({ helpOpen: true })
      return
    }

    if (input === 'q') {
      exit()
      return
    }

    if (input === 'R') {
      store.setState((current) => ({
        ...current,
        reverse: !current.reverse,
        follow: true,
      }))
      return
    }

    if (key.tab) {
      store.setState((current) => ({
        ...current,
        activeTabIndex: snapshot.sources.length === 0 ? 0 : (current.activeTabIndex + 1) % snapshot.sources.length,
        selectedIndex: 0,
        follow: true,
      }))
      return
    }

    if (key.shift && key.tab) {
      store.setState((current) => ({
        ...current,
        activeTabIndex: snapshot.sources.length === 0 ? 0 : (current.activeTabIndex - 1 + snapshot.sources.length) % snapshot.sources.length,
        selectedIndex: 0,
        follow: true,
      }))
      return
    }

    if (paneFocus === 'detail' && selectedEntry?.kind === 'json') {
      if (key.escape) {
        store.setState({ paneFocus: 'list' })
        return
      }
      if (key.return) {
        store.setState({ paneFocus: 'list' })
        return
      }
      if (key.upArrow || input === 'k') {
        store.setState((current) => ({ ...current, detailCursorIndex: clampIndex(current.detailCursorIndex - 1, treeLines.length) }))
        return
      }
      if (key.downArrow || input === 'j') {
        store.setState((current) => ({ ...current, detailCursorIndex: clampIndex(current.detailCursorIndex + 1, treeLines.length) }))
        return
      }
      if (input === ' ') {
        const line = treeLines[detailCursorIndex]
        if (line?.collapsible) {
          setFoldState((current) => {
            const next = new Set(current)
            if (next.has(line.id)) next.delete(line.id)
            else next.add(line.id)
            return next
          })
        }
      }
      return
    }

    if (paneFocus === 'detail' && selectedEntry?.kind === 'text') {
      if (key.escape || key.return) {
        store.setState({ paneFocus: 'list' })
      }
      return
    }

    if (key.return) {
      store.setState({ paneFocus: 'detail', detailCursorIndex: 0 })
      return
    }

    if (key.upArrow || input === 'k') {
      moveSelection(-1)
      return
    }
    if (key.downArrow || input === 'j') {
      moveSelection(1)
      return
    }
    if (key.pageUp) {
      moveSelection(-10)
      return
    }
    if (key.pageDown) {
      moveSelection(10)
      return
    }
    if (extendedKey.home || input === 'g') {
      jumpSelection(0)
      return
    }
    if (extendedKey.end || input === 'G') {
      jumpSelection(activeEntries.length - 1)
    }
  })

  const listHeight = Math.max(8, terminal.rows - 10)
  const listWidth = Math.min(60, Math.max(36, Math.floor(terminal.columns * 0.45)))
  const detailWidth = Math.max(40, terminal.columns - listWidth - 4)
  const listOffset = Math.max(0, Math.min(
    selectedIndex - Math.floor(listHeight / 2),
    Math.max(activeEntries.length - listHeight, 0),
  ))

  return (
    <Box flexDirection="column">
      <StatusLine />
      <Header sources={snapshot.sources} activeTabIndex={activeTabIndex} />
      {helpOpen ? <HelpModal /> : null}
      <Box flexDirection="row">
        <Box flexDirection="column" width={listWidth}>
          <VirtualSelectableList
            items={activeEntries}
            offset={listOffset}
            viewportSize={listHeight}
            renderItem={(entry: LogEntry, index: number) => (
              <LogListRow
                key={entry.id}
                entry={entry}
                selected={index === selectedIndex}
                width={listWidth - 3}
              />
            )}
          />
        </Box>
        <Box width={detailWidth} marginLeft={2} flexDirection="column">
          {!selectedEntry ? (
            <Text color="gray">No entry selected</Text>
          ) : selectedEntry.kind === 'json' && detailViewMode === 'tree' ? (
            <JsonTree value={selectedEntry.parsed} foldState={foldState} selectedIndex={detailCursorIndex} />
          ) : (
            <RawTextView text={selectedEntry.raw} />
          )}
        </Box>
      </Box>
      <Footer follow={follow} paneFocus={paneFocus} />
    </Box>
  )
}
