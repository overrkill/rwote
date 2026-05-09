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

// ── Notes API ────────────────────────────────────────

export async function saveNote(note: Note, _token: string) {
  const noteData = {
    id: note.id,
    title: note.title,
    content: note.content,
    tags: note.tags,
    pinned: note.pinned,
    updated_at: new Date().toISOString(),
  }

  const { data: existing } = await supabase
    .from('notes_v2')
    .select('id')
    .eq('id', note.id)
    .single()

  if (existing) {
    return supabase
      .from('notes_v2')
      .update(noteData)
      .eq('id', note.id)
  } else {
    return supabase
      .from('notes_v2')
      .insert({
        ...noteData,
        created_at: note.created_at || new Date().toISOString(),
      })
  }
}

export async function loadNotes(_token: string): Promise<{ notes: Note[], error?: string }> {
  const { data, error } = await supabase
    .from('notes_v2')
    .select('*')
    .order('updated_at', { ascending: false })

  if (error) {
    return { notes: [], error: error.message }
  }

  const notes = (data || []).map((n: any) => ({
    id: String(n.id),
    title: n.title || 'Untitled',
    content: n.content || '',
    tags: n.tags || [],
    pinned: n.pinned || false,
    created_at: n.created_at || new Date().toISOString(),
    updated_at: n.updated_at || new Date().toISOString(),
  }))

  return { notes }
}

export async function deleteNote(noteId: string, _token: string) {
  return supabase
    .from('notes_v2')
    .delete()
    .eq('id', noteId)
}

// ── Subscription API ─────────────────────────────────

export async function getSubscriptionStatus(_token: string): Promise<SubscriptionStatus> {
  try {
    const user = await getAuthUser()
    if (!user) {
      return { subscription_status: null, can_sync: false }
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error || !data) {
      return { subscription_status: 'trial', can_sync: true }
    }

    const now = new Date()
    const trialEnds = data.trial_ends_at ? new Date(data.trial_ends_at) : null
    const daysLeft = trialEnds ? Math.ceil((trialEnds.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0

    return {
      subscription_status: data.subscription_status || 'trial',
      trial_ends_at: data.trial_ends_at,
      days_left: daysLeft > 0 ? daysLeft : 0,
      can_sync: true,
      email: data.email,
    }
  } catch {
    return { subscription_status: null, can_sync: false }
  }
}

export async function subscribeToPlan(plan: string, _token: string) {
  const user = await getAuthUser()
  if (!user) throw new Error('Not authenticated')

  return supabase
    .from('profiles')
    .update({
      subscription_status: plan,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)
}

// ── AI Settings ──────────────────────────────────────

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

// ── User Settings ────────────────────────────────────

export interface UserSettings {
  theme: string
  aiProvider: 'disabled' | 'ollama' | 'groq'
  aiOllamaUrl: string
  aiOllamaModel: string
  fontSize: 'small' | 'medium' | 'large'
}

const USER_SETTINGS_KEY = 'rwote_user_settings'

export function getStoredUserSettings(): UserSettings | null {
  if (typeof window === 'undefined') return null
  const stored = localStorage.getItem(USER_SETTINGS_KEY)
  if (stored) {
    return JSON.parse(stored)
  }
  return null
}

export async function loadUserSettings(): Promise<UserSettings> {
  const defaults: UserSettings = {
    theme: 'paper_dark',
    aiProvider: 'disabled',
    aiOllamaUrl: 'http://localhost:11434',
    aiOllamaModel: 'llama3.2',
    fontSize: 'medium',
  }

  try {
    const { data, error } = await supabase
      .rpc('get_user_settings')

    if (error || !data) {
      return getStoredUserSettings() || defaults
    }

    const row = Array.isArray(data) ? data[0] : data
    if (!row) {
      return getStoredUserSettings() || defaults
    }

    const settings: UserSettings = {
      theme: row.theme || defaults.theme,
      aiProvider: row.ai_provider || defaults.aiProvider,
      aiOllamaUrl: row.ai_ollama_url || defaults.aiOllamaUrl,
      aiOllamaModel: row.ai_ollama_model || defaults.aiOllamaModel,
      fontSize: row.font_size || defaults.fontSize,
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem(USER_SETTINGS_KEY, JSON.stringify(settings))
    }

    return settings
  } catch {
    return getStoredUserSettings() || defaults
  }
}

export async function saveUserSettings(settings: Partial<UserSettings>): Promise<void> {
  const currentSettings = await loadUserSettings()
  const merged = { ...currentSettings, ...settings }

  if (typeof window !== 'undefined') {
    localStorage.setItem(USER_SETTINGS_KEY, JSON.stringify(merged))
  }

  try {
    await supabase.rpc('update_user_settings', {
      p_theme: settings.theme,
      p_ai_provider: settings.aiProvider,
      p_ai_ollama_url: settings.aiOllamaUrl,
      p_ai_ollama_model: settings.aiOllamaModel,
      p_font_size: settings.fontSize,
    })
  } catch (error) {
    console.error('Failed to save user settings to DB:', error)
  }
}

// ── Summarization ────────────────────────────────────

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

export async function summarizeUsingCloud(text: string, _token: string): Promise<SummarizeResult> {
  const prompt = SUMMARY_PROMPT.replace('{{TEXT}}', text)

  const response = await fetch('https://api.anyscale.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.NEXT_PUBLIC_ANYSCALE_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'meta-llama/Llama-3.1-8B-Instruct',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    }),
  })

  if (!response.ok) {
    throw new Error(`AI summarization failed: ${response.status}`)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content || ''
  return parseSummarizeResponse(content)
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