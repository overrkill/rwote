'use client'

import { useState, useRef, useEffect } from 'react'
import { signIn, signInWithGoogle, setStoredUser } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTheme } from '@/components/providers/theme-provider'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [showThemeMenu, setShowThemeMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { themeId, setTheme } = useTheme()

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowThemeMenu(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true)
    const { error } = await signInWithGoogle()
    if (error) {
      setError(error.message)
      setGoogleLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data, error: authError } = await signIn(email, password)

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      setStoredUser({
        id: data.user.id,
        email: data.user.email || '',
        name: data.user.user_metadata?.name,
      })
      router.push('/dashboard')
    }
    setLoading(false)
  }

  const themeList = [
    { id: 'paper_dark', name: 'Paper Dark' },
    { id: 'tokyonight', name: 'Tokyo Night' },
    { id: 'catppuccin', name: 'Catppuccin' },
    { id: 'nord', name: 'Nord' },
    { id: 'monokai', name: 'Monokai' },
    { id: 'light', name: 'Light' },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-[#fafafa] dark:bg-[#0f0e0d]">
      {/* Header */}
      <header className="border-b border-[#d8d8d8] dark:border-[#3a3a38] px-4 py-4">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <Link href="/" className="text-2xl text-[#1a1a1a] dark:text-[#f5f2ec]" style={{ fontFamily: "'Grand Hotel', cursive" }}>
            Rwote
          </Link>
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
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md p-8 bg-white dark:bg-[#1a1a19] rounded-lg shadow-md border border-[#d8d8d8] dark:border-[#3a3a38]">
          <h1 className="text-2xl font-bold mb-6 text-center text-[#1a1a1a] dark:text-[#f5f2ec]">Sign In</h1>
          
          {/* Google Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white dark:bg-[#2a2a28] text-[#1a1a1a] dark:text-[#f5f2ec] border border-[#d8d8d8] dark:border-[#3a3a38] rounded-md font-semibold cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-[#3a3a38] disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {googleLoading ? 'Redirecting...' : 'Continue with Google'}
          </button>
          
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-[#d8d8d8] dark:bg-[#3a3a38]"></div>
            <span className="text-sm text-[#555555] dark:text-[#a0a0a0]">or</span>
            <div className="flex-1 h-px bg-[#d8d8d8] dark:bg-[#3a3a38]"></div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#555555] dark:text-[#a0a0a0] mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-3 text-base bg-[#f0f0f0] dark:bg-[#2a2a28] text-[#1a1a1a] dark:text-[#f5f2ec] border border-[#d8d8d8] dark:border-[#3a3a38] rounded-md outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#555555] dark:text-[#a0a0a0] mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-3 text-base bg-[#f0f0f0] dark:bg-[#2a2a28] text-[#1a1a1a] dark:text-[#f5f2ec] border border-[#d8d8d8] dark:border-[#3a3a38] rounded-md outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="Your password"
                required
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-2.5 bg-[#1a1a1a] dark:bg-[#f5f2ec] text-white dark:text-[#0f0e0d] border-none rounded-md font-semibold cursor-pointer transition-opacity hover:opacity-85 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-[#555555] dark:text-[#a0a0a0]">
            Don&apos;t have an account?{' '}
            <a href="/auth/register" className="text-[#1a1a1a] dark:text-[#f5f2ec] underline">
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
