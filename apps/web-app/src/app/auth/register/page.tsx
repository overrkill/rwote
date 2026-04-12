'use client'

import { useState } from 'react'
import { signUp, setLocalAuth } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data, error: authError } = await signUp(email, password, name)

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      setLocalAuth(
        {
          id: data.user.id,
          email: data.user.email || '',
          name: name,
        },
        data.session?.access_token || '',
        data.session?.refresh_token || ''
      )
      router.push('/dashboard')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafafa] dark:bg-[#0f0e0d]">
      <div className="w-full max-w-md p-8 bg-white dark:bg-[#1a1a19] rounded-lg shadow-md border border-[#d8d8d8] dark:border-[#3a3a38]">
        <h1 className="text-2xl font-bold mb-6 text-center text-[#1a1a1a] dark:text-[#f5f2ec]">Create Account</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-[#555555] dark:text-[#a0a0a0] mb-1">
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-3 text-base bg-[#f0f0f0] dark:bg-[#2a2a28] text-[#1a1a1a] dark:text-[#f5f2ec] border border-[#d8d8d8] dark:border-[#3a3a38] rounded-md outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500"
              placeholder="Your name"
            />
          </div>

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
              placeholder="At least 6 characters"
              minLength={6}
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
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-[#555555] dark:text-[#a0a0a0]">
          Already have an account?{' '}
          <a href="/auth/login" className="text-[#1a1a1a] dark:text-[#f5f2ec] underline">
            Sign in
          </a>
        </p>
      </div>
    </div>
  )
}
