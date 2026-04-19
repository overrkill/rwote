import { createClient } from '@supabase/supabase-js'
import type { Note, User, SubscriptionStatus, AiSettings, SummarizeResult } from './types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

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
  const authUser: User = {
    id: user.id,
    email: user.email || '',
    name: user.user_metadata?.name || user.user_metadata?.full_name,
    avatar: user.user_metadata?.avatar || user.user_metadata?.picture,
  }
  setStoredUser(authUser)
  return authUser
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
        avatar: session.user.user_metadata?.avatar || session.user.user_metadata?.picture,
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
  const url = `${supabaseUrl}/functions/v1/${functionName}`
  
  let response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    })
  } catch (networkError) {
    console.error('Network error calling edge function:', networkError)
    throw new Error(`Network error: ${networkError}`)
  }
  
  const data = await response.json().catch(() => ({}))
  
  if (!response.ok) {
    const errorMsg = data.error || `Request failed with status ${response.status}`
    console.error('Edge function error:', errorMsg)
    throw new Error(errorMsg)
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
      id: String(n.id),
      title: n.title || 'Untitled',
      content: n.content || '',
      tags: n.tags || [],
      pinned: n.pinned || false,
      created_at: n.created_at || new Date().toISOString(),
      updated_at: n.updated_at || new Date().toISOString(),
    })),
    error: result.error
  }
}

export async function deleteNote(noteId: string, token: string) {
  return callEdgeFunction('delete-note', { id: noteId }, token)
}

export async function getSubscriptionStatus(token: string): Promise<SubscriptionStatus> {
  return callEdgeFunction('subscription-status', {}, token)
}

export async function subscribeToPlan(plan: string, token: string) {
  return callEdgeFunction('subscribe', { plan }, token)
}

const AI_SETTINGS_KEY = 'rwote_ai_settings'

export function getAiSettings(): AiSettings {
  if (typeof window === 'undefined') {
    return { provider: 'disabled', ollamaUrl: 'http://localhost:11434', ollamaModel: 'llama3.2' }
  }
  const stored = localStorage.getItem(AI_SETTINGS_KEY)
  if (stored) {
    return JSON.parse(stored)
  }
  return { provider: 'disabled', ollamaUrl: 'http://localhost:11434', ollamaModel: 'llama3.2' }
}

export function setAiSettings(settings: AiSettings) {
  if (typeof window === 'undefined') return
  localStorage.setItem(AI_SETTINGS_KEY, JSON.stringify(settings))
}

const SUMMARY_PROMPT = `You are a precise summarization assistant. Given the text below, do the following:

1. Summarize the content into **4-5 concise bullet points** using markdown formatting.
2. Each bullet point should capture a distinct key idea — no repetition.
3. At the end, add **1-4 relevant hashtags** that best represent the topic or theme of the text.

Respond ONLY in this format:

**Summary:**
- bullet point 1
- bullet point 2
- bullet point 3
- bullet point 4
- bullet point 5 (if needed)

**Tags:** #tag1 #tag2 #tag3

---
Text:
{{TEXT}}`

function parseSummarizeResponse(response: string): SummarizeResult {
  let summary = ''
  let tags: string[] = []

  const summaryMatch = response.match(/\*\*Summary:\*\*\s*([\s\S]*?)(?=\*\*Tags:|$)/i)
  const tagsMatch = response.match(/\*\*Tags:\*\*\s*(.*?)$/im)

  if (summaryMatch) {
    summary = summaryMatch[1]
      .trim()
      .split('\n')
      .map(line => line.replace(/^[-*]\s*/, '').trim())
      .filter(line => line.length > 0)
      .join('\n')
  }

  if (tagsMatch) {
    const tagMatches = tagsMatch[1].match(/#?(\w+)/g) || []
    tags = tagMatches.map(t => t.replace('#', '').toLowerCase()).filter(t => t.length > 0)
  }

  if (!summary && response.trim()) {
    summary = response.trim().split('\n').slice(0, 4).join('\n')
  }

  if (tags.length === 0) {
    const hashtagMatches = response.match(/#(\w+)/gi) || []
    tags = hashtagMatches.slice(0, 4).map(t => t.replace('#', '').toLowerCase())
  }

  return { summary, tags }
}

export async function summarizeUsingCloud(text: string, token: string): Promise<SummarizeResult> {
  try {
    const response = await callEdgeFunction('summarize', { text }, token)

    if (response.error) {
      throw new Error(response.error)
    }

    return parseSummarizeResponse(response.response)
  } catch (error) {
    console.error('Cloud summarization failed:', error)
    throw error
  }
}

export async function summarizeUsingLocal(text: string, url: string, model: string): Promise<SummarizeResult> {
  const prompt = SUMMARY_PROMPT.replace('{{TEXT}}', text)

  const response = await fetch(`${url}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: model,
      prompt: prompt,
      stream: false
    })
  })

  if (!response.ok) {
    throw new Error(`Ollama error: ${response.status}`)
  }

  const data = await response.json()
  return parseSummarizeResponse(data.response)
}