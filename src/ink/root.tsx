import React, { createContext, useContext } from 'react'

const ThemeContext = createContext<'cyan' | 'amber'>('cyan')

export function ThemeProvider(props: { children: React.ReactNode }): React.ReactElement {
  return <ThemeContext.Provider value="cyan">{props.children}</ThemeContext.Provider>
}

export function useThemeToken(): 'cyan' | 'amber' {
  return useContext(ThemeContext)
}
