import { createContext, useContext } from 'react'

export type ThemeMode = 'dark' | 'light'

export type ThemeContextValue = {
  mode: ThemeMode
  isDark: boolean
  setMode: (mode: ThemeMode) => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)

export function useAppTheme() {
  const value = useContext(ThemeContext)

  if (!value) {
    throw new Error('useAppTheme must be used inside AppThemeProvider')
  }

  return value
}
