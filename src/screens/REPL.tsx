import React, { useEffect, useMemo, useState } from 'react'
import clipboard from 'clipboardy'
import { Box, Text, useApp, useInput } from 'ink'
import { Header } from '../components/Header.js'
import { Footer } from '../components/Footer.js'
import { FilterBar } from '../components/FilterBar.js'
import { HelpModal } from '../components/HelpModal.js'
import { JsonTree } from '../components/JsonTree.js'
import { LogListRow } from '../components/LogListRow.js'
import { RawTextView } from '../components/RawTextView.js'
import { SearchBar } from '../components/SearchBar.js'
import { StatusLine } from '../components/StatusLine.js'
import { VirtualSelectableList } from '../components/VirtualSelectableList.js'
import { useAppState, useAppStateStore } from '../state/AppState.js'
import { useTerminalSize } from '../hooks/useTerminalSize.js'
import { QueryEngine, type LoggerSession } from '../QueryEngine.js'
import { clampIndex, getBottomIndex, shouldFollowSelection } from '../query.js'
import { findJsonTreeMatch, findJsonTreeMatchWrapped, findTextMatchWrapped, getJsonTreeCopyValue } from '../lib/query/detailTools.js'
import { matchesQuery, parseQuery } from '../lib/query/filter.js'
import { splitHighlightedText } from '../lib/query/highlight.js'
import { matchesBinding } from '../lib/query/keybindings.js'
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
  const mergeSort = useAppState((state) => state.mergeSort)
  const replMode = useAppState((state) => state.replMode)
  const queryText = useAppState((state) => state.queryText)
  const detailCursorIndex = useAppState((state) => state.detailCursorIndex)
  const detailViewMode = useAppState((state) => state.detailViewMode)
  const terminal = useTerminalSize()
  const [session, setSession] = useState<LoggerSession | null>(null)
  const [version, setVersion] = useState(0)
  const [foldState, setFoldState] = useState<Set<string>>(new Set())
  const [detailSearchText, setDetailSearchText] = useState('')
  const [lastDetailSearch, setLastDetailSearch] = useState('')
  const [preserveAnsi, setPreserveAnsi] = useState(props.options.preserveAnsi)
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

  const snapshot = session?.getSnapshot() ?? { version: 0, sources: [], config: { columns: [] }, merged: false }
  const activeSource = snapshot.sources[activeTabIndex]
  const columns = snapshot.config?.columns ?? []
  const mergedMode = Boolean(snapshot.merged && activeSource?.spec.id === 'merge-0')
  const allEntries = useMemo(
    () => (activeSource ? session?.getEntries(activeSource.spec.id, reverse, mergeSort) ?? [] : []),
    [session, activeSource?.spec.id, reverse, mergeSort, version],
  )
  const queryClauses = useMemo(() => parseQuery(queryText), [queryText])
  const activeEntries = useMemo(
    () => (queryClauses.length === 0 ? allEntries : allEntries.filter((entry) => matchesQuery(entry, queryClauses))),
    [allEntries, queryClauses],
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
  const detailMatchCount = useMemo(() => {
    if (!detailSearchText) {
      return 0
    }

    if (selectedEntry?.kind === 'json') {
      return treeLines.reduce((sum, line) => sum + splitHighlightedText(line.valuePreview, detailSearchText).matchCount, 0)
    }

    return selectedEntry ? splitHighlightedText(selectedEntry.raw, detailSearchText).matchCount : 0
  }, [detailSearchText, selectedEntry, treeLines])
  const currentDetailMatch = useMemo(() => {
    if (!detailSearchText) {
      return 0
    }

    if (selectedEntry?.kind === 'json') {
      let ordinal = 0
      for (let index = 0; index < treeLines.length; index += 1) {
        const line = treeLines[index]
        if (!line) continue
        const matchCount = splitHighlightedText(line.valuePreview, detailSearchText).matchCount
        if (matchCount > 0) {
          ordinal += 1
        }
        if (index === detailCursorIndex && matchCount > 0) {
          return ordinal
        }
      }
      return 0
    }

    return detailMatchCount > 0 ? 1 : 0
  }, [detailSearchText, selectedEntry, treeLines, detailCursorIndex, detailMatchCount])

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
    const config = snapshot.config

    if (helpOpen) {
      if (key.escape || input === 'q' || matchesBinding('openHelp', input, extendedKey, config)) {
        store.setState({ helpOpen: false })
      }
      return
    }

    if (replMode === 'filter') {
      if (key.escape) {
        store.setState({ replMode: 'browse' })
      }
      return
    }

    if (replMode === 'detail-search') {
      if (key.escape) {
        store.setState({ replMode: 'browse' })
      }
      return
    }

    if (matchesBinding('openHelp', input, extendedKey, config)) {
      store.setState({ helpOpen: true })
      return
    }

    if (matchesBinding('openFilter', input, extendedKey, config)) {
      store.setState({ replMode: 'filter' })
      return
    }

    if (input === 'q') {
      exit()
      return
    }

    if (matchesBinding('toggleReverse', input, extendedKey, config)) {
      store.setState((current) => ({
        ...current,
        reverse: !current.reverse,
        follow: true,
      }))
      return
    }

    if (mergedMode && matchesBinding('cycleMergeSort', input, extendedKey, config)) {
      store.setState((current) => ({
        ...current,
        mergeSort: current.mergeSort === 'time' ? 'source' : 'time',
      }))
      return
    }

    if (matchesBinding('nextTab', input, extendedKey, config)) {
      store.setState((current) => ({
        ...current,
        activeTabIndex: snapshot.sources.length === 0 ? 0 : (current.activeTabIndex + 1) % snapshot.sources.length,
        selectedIndex: 0,
        follow: true,
      }))
      return
    }

    if (matchesBinding('prevTab', input, extendedKey, config)) {
      store.setState((current) => ({
        ...current,
        activeTabIndex: snapshot.sources.length === 0 ? 0 : (current.activeTabIndex - 1 + snapshot.sources.length) % snapshot.sources.length,
        selectedIndex: 0,
        follow: true,
      }))
      return
    }

    if (paneFocus === 'detail' && selectedEntry?.kind === 'json') {
      if (matchesBinding('detailSearch', input, extendedKey, config)) {
        store.setState({ replMode: 'detail-search' })
        return
      }
      if (matchesBinding('repeatSearchNext', input, extendedKey, config) && lastDetailSearch) {
        const next = findJsonTreeMatchWrapped(treeLines, lastDetailSearch, detailCursorIndex + 1, 'forward')
        const nextIndex = next.index
        if (nextIndex >= 0) {
          store.setState({ detailCursorIndex: nextIndex })
          store.setState({ statusLine: next.wrapped ? `Wrapped to next match: ${lastDetailSearch}` : `Next match: ${lastDetailSearch}` })
        } else {
          store.setState({ statusLine: `No match for: ${lastDetailSearch}` })
        }
        return
      }
      if (matchesBinding('repeatSearchPrev', input, extendedKey, config) && lastDetailSearch) {
        const previous = findJsonTreeMatchWrapped(treeLines, lastDetailSearch, detailCursorIndex - 1, 'backward')
        if (previous.index >= 0) {
          store.setState({ detailCursorIndex: previous.index })
          store.setState({ statusLine: previous.wrapped ? `Wrapped to previous match: ${lastDetailSearch}` : `Previous match: ${lastDetailSearch}` })
        } else {
          store.setState({ statusLine: `No match for: ${lastDetailSearch}` })
        }
        return
      }
      if (key.escape) {
        store.setState({ paneFocus: 'list' })
        return
      }
      if (key.return) {
        store.setState({ paneFocus: 'list' })
        return
      }
      if (matchesBinding('moveUp', input, extendedKey, config)) {
        store.setState((current) => ({ ...current, detailCursorIndex: clampIndex(current.detailCursorIndex - 1, treeLines.length) }))
        return
      }
      if (matchesBinding('moveDown', input, extendedKey, config)) {
        store.setState((current) => ({ ...current, detailCursorIndex: clampIndex(current.detailCursorIndex + 1, treeLines.length) }))
        return
      }
      if (matchesBinding('toggleFold', input, extendedKey, config)) {
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
      if (matchesBinding('copyValue', input, extendedKey, config)) {
        const line = treeLines[detailCursorIndex]
        if (line) {
          const text = getJsonTreeCopyValue(line, 'value')
          void clipboard.write(text)
          store.setState({ statusLine: `Copied value: ${text}` })
        }
      }
      if (matchesBinding('copyPath', input, extendedKey, config)) {
        const line = treeLines[detailCursorIndex]
        if (line) {
          const text = getJsonTreeCopyValue(line, 'path')
          void clipboard.write(text)
          store.setState({ statusLine: `Copied path: ${text}` })
        }
      }
      return
    }

    if (paneFocus === 'detail' && selectedEntry?.kind === 'text') {
      if (matchesBinding('detailSearch', input, extendedKey, config)) {
        store.setState({ replMode: 'detail-search' })
        return
      }
      if (matchesBinding('repeatSearchNext', input, extendedKey, config) && lastDetailSearch) {
        const next = findTextMatchWrapped(selectedEntry.raw, lastDetailSearch, 0, 'forward')
        if (next.index >= 0) {
          store.setState({ statusLine: next.wrapped ? `Wrapped to next match: ${lastDetailSearch}` : `Next match: ${lastDetailSearch}` })
        } else {
          store.setState({ statusLine: `No match for: ${lastDetailSearch}` })
        }
        return
      }
      if (matchesBinding('repeatSearchPrev', input, extendedKey, config) && lastDetailSearch) {
        const previous = findTextMatchWrapped(selectedEntry.raw, lastDetailSearch, selectedEntry.raw.length - 1, 'backward')
        if (previous.index >= 0) {
          store.setState({ statusLine: previous.wrapped ? `Wrapped to previous match: ${lastDetailSearch}` : `Previous match: ${lastDetailSearch}` })
        } else {
          store.setState({ statusLine: `No match for: ${lastDetailSearch}` })
        }
        return
      }
      if (matchesBinding('toggleAnsi', input, extendedKey, config)) {
        setPreserveAnsi((current) => !current)
        store.setState({ statusLine: `ANSI detail ${!preserveAnsi ? 'enabled' : 'disabled'}` })
        return
      }
      if (key.escape || key.return) {
        store.setState({ paneFocus: 'list' })
      }
      return
    }

    if (matchesBinding('enterDetail', input, extendedKey, config)) {
      store.setState({ paneFocus: 'detail', detailCursorIndex: 0 })
      return
    }

    if (matchesBinding('moveUp', input, extendedKey, config)) {
      moveSelection(-1)
      return
    }
    if (matchesBinding('moveDown', input, extendedKey, config)) {
      moveSelection(1)
      return
    }
    if (matchesBinding('pageUp', input, extendedKey, config)) {
      moveSelection(-10)
      return
    }
    if (matchesBinding('pageDown', input, extendedKey, config)) {
      moveSelection(10)
      return
    }
    if (matchesBinding('jumpTop', input, extendedKey, config)) {
      jumpSelection(0)
      return
    }
    if (matchesBinding('jumpBottom', input, extendedKey, config)) {
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
      <Header
        sources={snapshot.sources}
        activeTabIndex={activeTabIndex}
        filteredCount={activeEntries.length}
        queryText={queryText}
        columns={columns}
        detailSearchText={detailSearchText}
        detailMatchCount={detailMatchCount}
        currentDetailMatch={currentDetailMatch}
        mergedMode={mergedMode}
        mergeSort={mergeSort}
      />
      {replMode === 'filter' ? (
        <FilterBar
          value={queryText}
          onChange={(value) => {
            store.setState({
              queryText: value,
              selectedIndex: 0,
              follow: false,
            })
          }}
          onSubmit={() => {
            store.setState({ replMode: 'browse' })
          }}
        />
      ) : null}
      {replMode === 'detail-search' ? (
        <SearchBar
          value={detailSearchText}
          label="?"
          onChange={(value) => {
            setDetailSearchText(value)
            setLastDetailSearch(value)
            const nextIndex = findJsonTreeMatch(treeLines, value, 0)
            if (nextIndex >= 0) {
              store.setState({ detailCursorIndex: nextIndex })
            }
            store.setState({ statusLine: `Detail matches: ${selectedEntry?.kind === 'json' ? treeLines.reduce((sum, line) => sum + splitHighlightedText(line.valuePreview, value).matchCount, 0) : selectedEntry ? splitHighlightedText(selectedEntry.raw, value).matchCount : 0}` })
          }}
          onSubmit={(value) => {
            const nextIndex = findJsonTreeMatch(treeLines, value, detailCursorIndex + 1)
            if (nextIndex >= 0) {
              store.setState({ detailCursorIndex: nextIndex })
            }
            store.setState({ replMode: 'browse' })
          }}
        />
      ) : null}
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
                columns={columns}
                mergedMode={mergedMode}
                sourceLabel={snapshot.sources.find((source) => source.spec.id === entry.sourceId)?.spec.label}
              />
            )}
          />
        </Box>
        <Box width={detailWidth} marginLeft={2} flexDirection="column">
          {!selectedEntry ? (
            <Text color="gray">No entry selected</Text>
          ) : selectedEntry.kind === 'json' && detailViewMode === 'tree' ? (
            <JsonTree
              value={selectedEntry.parsed}
              foldState={foldState}
              selectedIndex={detailCursorIndex}
              searchText={detailSearchText}
            />
          ) : (
            <RawTextView text={selectedEntry.raw} searchText={detailSearchText} preserveAnsi={preserveAnsi} />
          )}
        </Box>
      </Box>
      <Footer
        follow={follow}
        paneFocus={paneFocus}
        replMode={replMode}
        mergedMode={mergedMode}
        mergeSort={mergeSort}
      />
    </Box>
  )
}
