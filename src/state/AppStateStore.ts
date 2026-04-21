import type { DetailViewMode, PaneFocus, ReplMode } from '../types.js'

export interface AppState {
  cwd: string
  statusLine: string
  activeTabIndex: number
  selectedIndex: number
  paneFocus: PaneFocus
  helpOpen: boolean
  reverse: boolean
  follow: boolean
  replMode: ReplMode
  queryText: string
  detailViewMode: DetailViewMode
  detailCursorIndex: number
}

type Listener = () => void

export class AppStateStore {
  private state: AppState
  private listeners = new Set<Listener>()

  constructor(initial: AppState) {
    this.state = initial
  }

  getState(): AppState {
    return this.state
  }

  setState(update: Partial<AppState> | ((current: AppState) => AppState)): void {
    this.state = typeof update === 'function' ? update(this.state) : { ...this.state, ...update }
    for (const listener of this.listeners) {
      listener()
    }
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }
}

export function createInitialAppState(cwd: string): AppState {
  return {
    cwd,
    statusLine: 'Waiting for logs',
    activeTabIndex: 0,
    selectedIndex: 0,
    paneFocus: 'list',
    helpOpen: false,
    reverse: false,
    follow: true,
    replMode: 'browse',
    queryText: '',
    detailViewMode: 'tree',
    detailCursorIndex: 0,
  }
}
