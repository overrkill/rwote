import { createClient } from '@supabase/supabase-js'
import type { Note, User, SubscriptionStatus } from './types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://joqxsbboxmkpcizasdbc.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvcXhzYmJveG1rcGNpemFzZGJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4NjI2ODgsImV4cCI6MjA5MTQzODY4OH0.AlJh4bvWk_aMxHnWFg4xqZhY3UzbUclcKtLvkBARAQo'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Auth functions
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

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user as User | null
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

// Edge function calls
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

// Notes functions
export async function saveNote(note: Note, token: string) {
  return callEdgeFunction('save-note', { note }, token)
}

export async function loadNotes(token: string) {
  return callEdgeFunction('load-notes', {}, token)
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

// Local storage helpers
const STORAGE_KEY = 'rwote_v1'
const TAGS_KEY = 'rwote_tags_v1'
const AUTH_USER_KEY = 'auth_user'
const AUTH_TOKEN_KEY = 'auth_token'
const AUTH_REFRESH_KEY = 'auth_refresh_token'
const MODE_KEY = 'rwote_mode_v1'

export function getLocalNotes(): Note[] {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem(STORAGE_KEY)
  return data ? JSON.parse(data) : []
}

export function setLocalNotes(notes: Note[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes))
}

export function getLocalAuth() {
  if (typeof window === 'undefined') return null
  const user = localStorage.getItem(AUTH_USER_KEY)
  const token = localStorage.getItem(AUTH_TOKEN_KEY)
  const refreshToken = localStorage.getItem(AUTH_REFRESH_KEY)
  
  if (user && token) {
    return {
      user: JSON.parse(user) as User,
      token,
      refreshToken,
    }
  }
  return null
}

export function setLocalAuth(user: User, token: string, refreshToken: string) {
  if (typeof window === 'undefined') return
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
  localStorage.setItem(AUTH_TOKEN_KEY, token)
  localStorage.setItem(AUTH_REFRESH_KEY, refreshToken)
}

export function clearLocalAuth() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(AUTH_USER_KEY)
  localStorage.removeItem(AUTH_TOKEN_KEY)
  localStorage.removeItem(AUTH_REFRESH_KEY)
}

export function getLocalMode(): string {
  if (typeof window === 'undefined') return 'local'
  return localStorage.getItem(MODE_KEY) || 'local'
}

export function setLocalMode(mode: string) {
  if (typeof window === 'undefined') return
  localStorage.setItem(MODE_KEY, mode)
}

// Merge cloud notes with local notes
export function mergeNotes(localNotes: Note[], cloudNotesRaw: unknown[]): Note[] {
  if (!cloudNotesRaw || cloudNotesRaw.length === 0) {
    return localNotes
  }

  // Convert cloud notes to our Note format
  const cloudNotes: Note[] = cloudNotesRaw.map((n: any) => ({
    id: String(n.local_id || n.id),
    text: n.text,
    note: n.note || '',
    tag: n.tag || 'uncategorized',
    date: n.date,
    pinned: n.pinned || false,
    updated_at: new Date(n.updated_at).getTime(),
    cloudId: n.id,
  }))

  // Create maps for merging
  const localMap = new Map(localNotes.map(n => [n.id, n]))
  const cloudMap = new Map(cloudNotes.map(n => [n.id, n]))
  
  // Start with local notes
  const merged = new Map(localMap)

  // Merge cloud notes - cloud wins if newer
  cloudMap.forEach((cloudNote, cloudId) => {
    const localNote = localMap.get(cloudId)
    if (!localNote) {
      // Cloud has note local doesn't - add it
      merged.set(cloudId, cloudNote)
    } else {
      // Both have it - compare timestamps
      const localTime = localNote.updated_at || 0
      const cloudTime = cloudNote.updated_at || 0
      if (cloudTime > localTime) {
        merged.set(cloudId, cloudNote)
      }
    }
  })

  // Sort by id (newest first)
  return Array.from(merged.values()).sort((a, b) => 
    Number(b.id) - Number(a.id)
  )
}
