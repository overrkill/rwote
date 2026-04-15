'use client'

import Link from 'next/link'
import { useEffect, useState, useRef } from 'react'
import { getStoredUser, onAuthStateChange } from '@/lib/supabase'
import { useAppTheme } from '@/components/providers/theme-provider'
import { THEMES } from '@/lib/themes'

export default function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const { theme, themeId, setTheme } = useAppTheme()
  const [showThemeMenu, setShowThemeMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const user = getStoredUser()
    setIsLoggedIn(!!user)

    const { data: { subscription } } = onAuthStateChange((user) => {
      setIsLoggedIn(!!user)
    })

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowThemeMenu(false)
      }
    }
    document.addEventListener('click', handleClickOutside)

    return () => {
      subscription?.unsubscribe()
      document.removeEventListener('click', handleClickOutside)
    }
  }, [])

  const themeList = [
    { id: 'paper_dark', name: 'Paper Dark' },
    { id: 'tokyonight', name: 'Tokyo Night' },
    { id: 'catppuccin', name: 'Catppuccin' },
    { id: 'nord', name: 'Nord' },
    { id: 'monokai', name: 'Monokai' },
    { id: 'light', name: 'Light' },
  ]

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#1a1a19]/80 backdrop-blur-sm border-b border-[#d8d8d8] dark:border-[#3a3a38]">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-3xl text-[#1a1a1a] dark:text-[#f5f2ec]" style={{ fontFamily: "'Grand Hotel', cursive" }}>
          Rwote
        </Link>
        <nav className="flex items-center gap-2 relative">
          <div className="relative" ref={menuRef}>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowThemeMenu(!showThemeMenu)
              }}
              className="p-2 rounded-lg hover:bg-[#f0f0f0] dark:hover:bg-[#2a2a28] transition-colors text-[#1a1a1a] dark:text-[#f5f2ec]"
              title="Theme"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="5"/>
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
              </svg>
            </button>
            {showThemeMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-[#242428] border border-[#d8d8d8] dark:border-[#3a3a40] rounded-lg shadow-lg overflow-hidden z-50">
                {themeList.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setTheme(t.id)
                      setShowThemeMenu(false)
                    }}
                    className={`w-full px-4 py-2.5 text-left text-sm flex items-center justify-between hover:bg-[#f0f0f0] dark:hover:bg-[#2e2e34] transition-colors ${
                      themeId === t.id ? 'bg-[#f0f0f0] dark:bg-[#2e2e34] font-medium' : ''
                    } text-[#1a1a1a] dark:text-[#f5f2ec]`}
                  >
                    <span>{t.name}</span>
                    {themeId === t.id && <span className="text-[#a0a0a0]">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
          {isLoggedIn ? (
            <Link href="/dashboard" className="px-4 py-2 bg-[#1a1a1a] dark:bg-[#f5f2ec] text-white dark:text-[#0f0e0d] border-none rounded-full font-semibold text-sm">
              Open App
            </Link>
          ) : (
            <>
              <Link href="/auth/login" className="text-sm text-[#555555] dark:text-[#a0a0a0] hover:text-[#1a1a1a] dark:hover:text-[#f5f2ec] transition-colors">
                Sign In
              </Link>
              <Link href="/auth/register" className="px-4 py-2 bg-[#1a1a1a] dark:bg-[#f5f2ec] text-white dark:text-[#0f0e0d] border-none rounded-full font-semibold text-sm">
                Get Started
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
