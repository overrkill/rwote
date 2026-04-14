import { createClient } from '@supabase/supabase-js'
import type { Note, User, SubscriptionStatus } from './types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://joqxsbboxmkpcizasdbc.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvcXhzYmJveG1rcGNpemFzZGJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4NjI2ODgsImV4cCI6MjA5MTQzODY4OH0.AlJh4bvWk_aMxHnWFg4xqZhY3UzbUclcKtLvkBARAQo'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ── Auth Helpers ─────────────────────────────────────
const AUTH_USER_KEY = 'rwote_auth_user'

export async function getAuthToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token || null
}

export async function getAuthUser(): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  return {
    id: user.id,
    email: user.email || '',
    name: user.user_metadata?.name || user.user_metadata?.full_name,
  }
}

export function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null
  const stored = localStorage.getItem(AUTH_USER_KEY)
  if (!stored) return null
  try {
    return JSON.parse(stored)
  } catch {
    return null
  }
}

export function setStoredUser(user: User | null) {
  if (typeof window === 'undefined') return
  if (user) {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
  } else {
    localStorage.removeItem(AUTH_USER_KEY)
  }
}

export function onAuthStateChange(callback: (user: User | null) => void) {
  return supabase.auth.onAuthStateChange((event, session) => {
    if (session?.user) {
      const user: User = {
        id: session.user.id,
        email: session.user.email || '',
        name: session.user.user_metadata?.name || session.user.user_metadata?.full_name,
      }
      setStoredUser(user)
      callback(user)
    } else {
      setStoredUser(null)
      callback(null)
    }
  })
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

export async function signUp(email: string, password: string, name?: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
    },
  })
  return { data, error }
}

export async function signInWithGoogle() {
  const redirectTo = typeof window !== 'undefined' 
    ? `${window.location.origin}/auth/callback` 
    : '/auth/callback'
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
    },
  })
  return { data, error }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user as User | null
}

async function callEdgeFunction(functionName: string, body: unknown, token: string) {
  const response = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })
  
  const data = await response.json()
  
  if (!response.ok) {
    throw new Error(data.error || 'Request failed')
  }
  
  return data
}

export async function saveNote(note: Note, token: string) {
  return callEdgeFunction('save-note', { note }, token)
}

export async function loadNotes(token: string): Promise<{ notes: Note[], error?: string }> {
  const result = await callEdgeFunction('load-notes', {}, token)
  return {
    notes: (result.notes || []).map((n: any) => ({
      id: String(n.local_id || n.id),
      text: n.text,
      note: n.note || '',
      tag: n.tag || 'uncategorized',
      date: n.date,
      pinned: n.pinned || false,
      updated_at: new Date(n.updated_at).getTime(),
      cloudId: n.id,
    })),
    error: result.error
  }
}

export async function deleteNote(localId: string, token: string) {
  return callEdgeFunction('delete-note', { local_id: localId }, token)
}

export async function getSubscriptionStatus(token: string): Promise<SubscriptionStatus> {
  return callEdgeFunction('subscription-status', {}, token)
}

export async function subscribeToPlan(plan: string, token: string) {
  return callEdgeFunction('subscribe', { plan }, token)
}
