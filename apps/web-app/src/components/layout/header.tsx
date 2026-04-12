'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getLocalAuth } from '@/lib/supabase'
import { useTheme } from '@/components/providers/theme-provider'

export default function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const { theme, toggleTheme } = useTheme()

  useEffect(() => {
    const auth = getLocalAuth()
    setIsLoggedIn(!!auth)
  }, [])

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#1a1a19]/80 backdrop-blur-sm border-b border-[#d8d8d8] dark:border-[#3a3a38]">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-3xl text-[#1a1a1a] dark:text-[#f5f2ec]" style={{ fontFamily: "'Grand Hotel', cursive" }}>
          Rwote
        </Link>
        <nav className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-[#f0f0f0] dark:hover:bg-[#2a2a28] transition-colors text-[#1a1a1a] dark:text-[#f5f2ec]"
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
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
