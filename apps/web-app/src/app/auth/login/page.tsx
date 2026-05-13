'use client'

import { useState, useRef, useEffect } from 'react'
import { signIn, signInWithGoogle, setStoredUser } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useTheme } from '@/components/providers/theme-provider'
import { Sun } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [showThemeMenu, setShowThemeMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams?.get('redirect') || 'dashboard'
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
        avatar: data.user.user_metadata?.avatar || data.user.user_metadata?.picture,
      })
      router.push(`/${redirectTo}?migrate=1`)
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
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--surface)' }}>
      {/* Header */}
      <header className="px-4 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-md mx-auto flex items-center justify-between">
          <Link href="/" className="text-2xl" style={{ fontFamily: "'Grand Hotel', cursive", color: 'var(--text-primary)' }}>
            Rwote
          </Link>
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
              <Sun size={20} strokeWidth={2} />
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
                    className="w-full px-4 py-2.5 text-left text-sm flex items-center justify-between transition-colors"
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
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md p-8 rounded-lg shadow-md" style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)' }}>
          <h1 className="text-2xl font-bold mb-6 text-center" style={{ color: 'var(--text-primary)' }}>Sign In</h1>
          
          {/* Google Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 px-6 py-3 rounded-md font-semibold cursor-pointer transition-all disabled:opacity-50"
            style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {googleLoading ? 'Redirecting...' : 'Continue with Google'}
          </button>

{!showEmailForm ? (
  <button
    type="button"
    onClick={() => setShowEmailForm(true)}
    className="w-full flex items-center justify-center gap-3 px-6 py-3 rounded-md font-semibold cursor-pointer transition-all mt-3"
    style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
  >
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
    Continue with Email
            </button>
) : (
  <form onSubmit={handleSubmit} className="space-y-4 mt-3">
    <div>
      <label htmlFor="email" className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
        Email
      </label>
      <input
        id="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full px-3.5 py-3 text-base rounded-md outline-none transition-all"
        style={{ backgroundColor: 'var(--surface-alt)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
        placeholder="you@example.com"
        required
        autoFocus
      />
    </div>
    <div>
      <label htmlFor="password" className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
        Password
      </label>
      <input
        id="password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full px-3.5 py-3 text-base rounded-md outline-none transition-all"
        style={{ backgroundColor: 'var(--surface-alt)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
        placeholder="Your password"
        required
      />
    </div>
    {error && (
      <p className="text-sm text-center" style={{ color: '#dc2626' }}>{error}</p>
    )}
    <button
      type="submit"
      disabled={loading}
      className="w-full px-6 py-2.5 rounded-md font-semibold cursor-pointer transition-opacity hover:opacity-85 disabled:opacity-50"
      style={{ backgroundColor: 'var(--accent-btn)', color: 'var(--bg)' }}
    >
      {loading ? 'Signing in...' : 'Sign In'}
    </button>
  </form>
)}
          
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border)' }}></div>
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>or</span>
            <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border)' }}></div>
          </div>

          <button
            type="button"
            onClick={() => window.location.href = '/dashboard?guest'}
            className="w-full mt-3 px-6 py-3 rounded-md font-semibold cursor-pointer transition-all"
            style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
          >
            Continue as guest →
          </button>

          <p className="mt-6 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
            Don&apos;t have an account?{' '}
            <a href="/auth/register" style={{ color: 'var(--text-primary)' }}>
              Sign up
            </a>
          </p>
		</div>
      </div>
    </div>
  )
}
