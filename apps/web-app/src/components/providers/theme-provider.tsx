'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { THEMES, applyTheme, getTheme, type Theme } from '@/lib/themes'
import { getStoredUserSettings } from '@/lib/supabase'

interface FontSettings {
  editorFont: string
  interfaceFont: string
  fontSize: string
}

function applyFontSettings(fonts: FontSettings) {
  const root = document.documentElement
  root.dataset.fontEditor = fonts.editorFont
  root.dataset.fontUi = fonts.interfaceFont
  root.dataset.fontSize = fonts.fontSize
}

interface ThemeContextType {
  theme: Theme
  themeId: string
  setTheme: (id: string) => void
}

const ThemeContext = createContext<ThemeContextType>({
  theme: THEMES.paper_dark,
  themeId: 'paper_dark',
  setTheme: () => {},
})

export function useTheme() {
  return useContext(ThemeContext)
}

export function useAppTheme() {
  return useContext(ThemeContext)
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeId] = useState<string>('paper_dark')

  useEffect(() => {
    const stored = localStorage.getItem('themeId') as string | null
    if (stored && THEMES[stored]) {
      setThemeId(stored)
      applyTheme(getTheme(stored))
    }

    const settings = getStoredUserSettings()
    if (settings) {
      applyFontSettings({
        editorFont: settings.editorFont || 'mono',
        interfaceFont: settings.interfaceFont || 'system',
        fontSize: settings.fontSize || 'medium',
      })
    }
  }, [])

  const setTheme = (id: string) => {
    const theme = getTheme(id)
    setThemeId(id)
    localStorage.setItem('themeId', id)
    applyTheme(theme)
  }

  return (
    <ThemeContext.Provider value={{ theme: getTheme(themeId), themeId, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
