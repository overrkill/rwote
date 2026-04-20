import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Note, User, SubscriptionStatus } from './types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export async function createServerSupabase() {
  const cookieStore = await cookies()
  
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch {
          // Called from Server Component
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: '', ...options })
        } catch {
          // Called from Server Component
        }
      },
    },
  })
}

export async function getInitialData() {
  const supabase = await createServerSupabase()
  
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session?.user) {
    return { notes: [], user: null, subscription: null }
  }
  
  const user: User = {
    id: session.user.id,
    email: session.user.email || '',
    name: session.user.user_metadata?.name || session.user.user_metadata?.full_name,
    avatar: session.user.user_metadata?.avatar || session.user.user_metadata?.picture,
  }
  
  const { data: notesData } = await supabase
    .from('notes_v2')
    .select('*')
    .order('updated_at', { ascending: false })
  
  const notes: Note[] = (notesData || []).map((n: any) => ({
    id: String(n.id),
    title: n.title || 'Untitled',
    content: n.content || '',
    tags: n.tags || [],
    pinned: n.pinned || false,
    created_at: n.created_at || new Date().toISOString(),
    updated_at: n.updated_at || new Date().toISOString(),
  }))
  
  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single()
  
  let subscription: SubscriptionStatus = { subscription_status: 'trial', can_sync: true }
  
  if (profileData) {
    const now = new Date()
    const trialEnds = profileData.trial_ends_at ? new Date(profileData.trial_ends_at) : null
    const daysLeft = trialEnds ? Math.ceil((trialEnds.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0
    
    subscription = {
      subscription_status: profileData.subscription_status || 'trial',
      trial_ends_at: profileData.trial_ends_at,
      days_left: daysLeft > 0 ? daysLeft : 0,
      can_sync: true,
      email: profileData.email,
    }
  }
  
  return { notes, user, subscription }
}