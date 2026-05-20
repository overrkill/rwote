'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { THEMES, applyTheme, getTheme, type Theme } from '@/lib/themes'
import { getStoredUserSettings } from '@/lib/supabase'
import { getFontOption, loadGoogleFont } from '@/lib/fonts'

function applyFontSettings(editorFont: string, interfaceFont: string, fontSize: number) {
  const root = document.documentElement

  root.style.setProperty('--font-size-base', `${fontSize}px`)

  const editorOpt = getFontOption(editorFont)
  if (editorOpt) {
    root.style.setProperty('--font-editor', editorOpt.cssStack)
    if (editorOpt.googleFont) loadGoogleFont(editorOpt.googleFont)
  }

  const uiOpt = getFontOption(interfaceFont)
  if (uiOpt) {
    root.style.setProperty('--font-ui', uiOpt.cssStack)
    if (uiOpt.googleFont) loadGoogleFont(uiOpt.googleFont)
  }
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
      applyFontSettings(
        settings.editorFont || 'jetbrains-mono',
        settings.interfaceFont || 'system',
        settings.fontSize || 14,
      )
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
