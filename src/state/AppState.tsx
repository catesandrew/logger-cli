import React, { createContext, useContext, useRef, useSyncExternalStore } from 'react'
import { AppStateStore, createInitialAppState, type AppState } from './AppStateStore.js'

const AppStateContext = createContext<AppStateStore | null>(null)

export function AppStateProvider(props: { cwd: string; children: React.ReactNode }): React.ReactElement {
  const storeRef = useRef<AppStateStore>()
  if (!storeRef.current) {
    storeRef.current = new AppStateStore(createInitialAppState(props.cwd))
  }
  return <AppStateContext.Provider value={storeRef.current}>{props.children}</AppStateContext.Provider>
}

export function useAppState<T>(selector: (state: AppState) => T): T {
  const store = useContext(AppStateContext)
  if (!store) {
    throw new Error('useAppState must be used within AppStateProvider')
  }
  return useSyncExternalStore(store.subscribe.bind(store), () => selector(store.getState()))
}

export function useAppStateStore(): AppStateStore {
  const store = useContext(AppStateContext)
  if (!store) {
    throw new Error('useAppStateStore must be used within AppStateProvider')
  }
  return store
}
