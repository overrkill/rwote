'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, setLocalAuth } from '@/lib/supabase'

export default function CallbackPage() {
  const router = useRouter()

  useEffect(() => {
    async function handleCallback() {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError || !session) {
        router.push('/auth/login')
        return
      }

      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        setLocalAuth(
          {
            id: user.id,
            email: user.email || '',
            name: user.user_metadata?.name || user.user_metadata?.full_name,
          },
          session.access_token,
          session.refresh_token
        )
        router.push('/dashboard')
      } else {
        router.push('/auth/login')
      }
    }

    handleCallback()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafafa] dark:bg-[#0f0e0d]">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-2 border-[#1a1a1a] dark:border-[#f5f2ec] border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-[#555555] dark:text-[#a0a0a0]">Signing you in...</p>
      </div>
    </div>
  )
}
