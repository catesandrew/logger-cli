import type { KeyAction, LoggerConfig } from '../../types.js'

export interface KeyLike {
  upArrow?: boolean
  downArrow?: boolean
  pageUp?: boolean
  pageDown?: boolean
  tab?: boolean
  shift?: boolean
  return?: boolean
  escape?: boolean
}

const DEFAULT_BINDINGS: Record<KeyAction, string[]> = {
  openHelp: ['f1', '?'],
  openFilter: ['/'],
  toggleReverse: ['R'],
  nextTab: ['tab'],
  prevTab: ['shift+tab'],
  moveUp: ['up', 'k'],
  moveDown: ['down', 'j'],
  pageUp: ['pageup'],
  pageDown: ['pagedown'],
  jumpTop: ['g', 'home'],
  jumpBottom: ['G', 'end'],
  enterDetail: ['enter'],
  leaveDetail: ['escape', 'enter'],
  toggleFold: ['space'],
  detailSearch: ['?'],
  repeatSearchNext: ['n'],
  repeatSearchPrev: ['N'],
  copyValue: ['y'],
  copyPath: ['p'],
  toggleAnsi: ['a'],
  cycleMergeSort: ['M'],
}

function normalizeInput(input: string, key: KeyLike): string[] {
  const values: string[] = []
  if (key.upArrow) values.push('up')
  if (key.downArrow) values.push('down')
  if (key.pageUp) values.push('pageup')
  if (key.pageDown) values.push('pagedown')
  if (key.return) values.push('enter')
  if (key.escape) values.push('escape')
  if (key.tab && key.shift) values.push('shift+tab')
  else if (key.tab) values.push('tab')
  if (input === ' ') values.push('space')
  if (input) values.push(input)
  return values
}

export function matchesBinding(
  action: KeyAction,
  input: string,
  key: KeyLike,
  config: LoggerConfig,
): boolean {
  const activeBindings = config.keybindings?.[action] ?? DEFAULT_BINDINGS[action]
  const normalized = normalizeInput(input, key)
  return normalized.some((value) => activeBindings.includes(value))
}
