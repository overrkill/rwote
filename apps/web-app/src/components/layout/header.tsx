'use client'

import Link from 'next/link'
import { useEffect, useState, useRef } from 'react'
import { getStoredUser, onAuthStateChange } from '@/lib/supabase'
import { useTheme } from '@/components/providers/theme-provider'

export default function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const { themeId, setTheme } = useTheme()
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
    <header className="sticky top-0 z-50 backdrop-blur-sm" style={{ backgroundColor: 'color-mix(in srgb, var(--bg) 80%, transparent)', borderBottom: '1px solid var(--border)' }}>
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-3xl" style={{ fontFamily: "'Grand Hotel', cursive", color: 'var(--text-primary)' }}>
          Rwote
        </Link>
        <nav className="flex items-center gap-2 relative">
          <div className="relative" ref={menuRef}>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowThemeMenu(!showThemeMenu)
              }}
              className="p-2 rounded-lg transition-colors"
              style={{ color: 'var(--text-primary)' }}
              title="Theme"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="5"/>
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
              </svg>
            </button>
            {showThemeMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 rounded-lg shadow-lg overflow-hidden z-50" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
                {themeList.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setTheme(t.id)
                      setShowThemeMenu(false)
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm flex items-center justify-between hover:opacity-80 transition-colors"
                    style={{
                      backgroundColor: themeId === t.id ? 'var(--surface-alt)' : 'transparent',
                      fontWeight: themeId === t.id ? 500 : 400,
                      color: 'var(--text-primary)'
                    }}
                  >
                    <span>{t.name}</span>
                    {themeId === t.id && <span style={{ color: 'var(--text-secondary)' }}>✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
          {isLoggedIn ? (
            <Link href="/dashboard" className="px-4 py-2 rounded-full font-semibold text-sm transition-opacity hover:opacity-85" style={{ backgroundColor: 'var(--accent-btn)', color: 'var(--bg)' }}>
              Open App
            </Link>
          ) : (
            <>
              <Link href="/auth/login" className="text-sm transition-colors" style={{ color: 'var(--text-secondary)' }}>
                Sign In
              </Link>
              <Link href="/auth/register" className="px-4 py-2 rounded-full font-semibold text-sm transition-opacity hover:opacity-85" style={{ backgroundColor: 'var(--accent-btn)', color: 'var(--bg)' }}>
                Get Started
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
