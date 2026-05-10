'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getStoredUser } from '@/lib/supabase'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    const user = getStoredUser()
    if (user) {
      router.push('/dashboard')
    } else {
      router.push('/dashboard?guest')
    }
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg)' }}>
      <div style={{ color: 'var(--text-secondary)' }}>Redirecting...</div>
    </div>
  )
}