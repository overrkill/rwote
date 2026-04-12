'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getLocalAuth } from '@/lib/supabase'

export default function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const auth = getLocalAuth()
    setIsLoggedIn(!!auth)
  }, [])

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-border">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-3xl" style={{ fontFamily: "'Grand Hotel', cursive" }}>
          Rwote
        </Link>
        <nav className="flex items-center gap-6">
          {isLoggedIn ? (
            <Link href="/dashboard" className="btn-primary text-sm">
              Open App
            </Link>
          ) : (
            <>
              <Link href="/auth/login" className="text-sm text-secondary hover:text-primary transition-colors">
                Sign In
              </Link>
              <Link href="/auth/register" className="btn-primary text-sm">
                Get Started
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
