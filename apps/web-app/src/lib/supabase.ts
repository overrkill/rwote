import { createClient } from '@supabase/supabase-js'
import type { Note, User, SubscriptionStatus, AiSettings, SummarizeResult, NoteAnalysis, AiAnalyzeConfig } from './types'

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
  fontSize: number
  editorFont: string
  interfaceFont: string
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
    fontSize: 14,
    editorFont: 'jetbrains-mono',
    interfaceFont: 'system',
  }

  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      return getStoredUserSettings() || defaults
    }

    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', session.user.id)
      .single()

    if (error) {
      console.error('loadUserSettings error:', error)
      return getStoredUserSettings() || defaults
    }

    if (!data) {
      return getStoredUserSettings() || defaults
    }

    const settings: UserSettings = {
      theme: data.theme || defaults.theme,
      aiProvider: (data.ai_provider as UserSettings['aiProvider']) || defaults.aiProvider,
      aiOllamaUrl: data.ai_ollama_url || defaults.aiOllamaUrl,
      aiOllamaModel: data.ai_ollama_model || defaults.aiOllamaModel,
      fontSize: typeof data.font_size === 'number' ? data.font_size : defaults.fontSize,
      editorFont: (data.editor_font as UserSettings['editorFont']) || defaults.editorFont,
      interfaceFont: (data.interface_font as UserSettings['interfaceFont']) || defaults.interfaceFont,
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem(USER_SETTINGS_KEY, JSON.stringify(settings))
    }

    return settings
  } catch (error) {
    console.error('loadUserSettings exception:', error)
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
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (settings.theme !== undefined) updates.theme = settings.theme
    if (settings.aiProvider !== undefined) updates.ai_provider = settings.aiProvider
    if (settings.aiOllamaUrl !== undefined) updates.ai_ollama_url = settings.aiOllamaUrl
    if (settings.aiOllamaModel !== undefined) updates.ai_ollama_model = settings.aiOllamaModel
    if (settings.fontSize !== undefined) updates.font_size = settings.fontSize
    if (settings.editorFont !== undefined) updates.editor_font = settings.editorFont
    if (settings.interfaceFont !== undefined) updates.interface_font = settings.interfaceFont

    const { error } = await supabase
      .from('user_settings')
      .update(updates)
      .eq('user_id', session.user.id)

    if (error) {
      console.error('saveUserSettings error:', error)
    }
  } catch (error) {
    console.error('saveUserSettings exception:', error)
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

// ── Note Analysis ─────────────────────────────────────

const ANALYZE_PROMPT = `You are a precise note analyzer. Given the text below, extract actionable items and informational content.

Identify these 4 categories:

1. **DEADLINES** — Any dates, due dates, or time-sensitive items mentioned
2. **TODOS** — Tasks, action items, or things that need to be done
3. **FOLLOW_UPS** — Things that need follow-up, check-ins, or revisiting (with dates if mentioned)
4. **FLASH_CARDS** — Key facts, concepts, or definitions that could be turned into study flashcards (front = question/prompt, back = answer/explanation)

Analyze the text thoroughly. If a category has no items, return an empty array for it.

Respond ONLY in this JSON format (no markdown, no code blocks):
{
  "deadlines": [
    { "text": "description of deadline", "date": "specific date if mentioned" }
  ],
  "todos": [
    { "text": "action item description" }
  ],
  "followUps": [
    { "text": "follow-up description", "date": "specific date if mentioned" }
  ],
  "flashCards": [
    { "front": "question or prompt", "back": "answer or explanation" }
  ]
}

-----
{{TEXT}}`

function extractJsonFromResponse(content: string): string {
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/)
  return jsonMatch ? jsonMatch[1].trim() : content.trim()
}

function parseAnalysisResponse(content: string): NoteAnalysis {
  const jsonStr = extractJsonFromResponse(content)
  try {
    const data = JSON.parse(jsonStr)
    return {
      deadlines:  data.deadlines  || [],
      todos:      data.todos      || [],
      followUps:  data.followUps  || [],
      flashCards: data.flashCards || [],
    }
  } catch {
    console.error('Failed to parse analysis response:', content)
    throw new Error('AI returned invalid JSON')
  }
}

export async function analyzeNoteDirect(text: string, config: AiAnalyzeConfig): Promise<NoteAnalysis> {
  const prompt = ANALYZE_PROMPT.replace('{{TEXT}}', text)
  const messages = [{ role: 'user', content: prompt }]

  if (config.provider === 'ollama') {
    const base = config.baseUrl.replace(/\/$/, '')
    const res = await fetch(`${base}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: config.model, messages, stream: false }),
    })
    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Ollama error ${res.status}: ${err}`)
    }
    const data = await res.json()
    const content = data.message?.content || data.response || ''
    return parseAnalysisResponse(content)
  }

  const base = config.baseUrl.replace(/\/$/, '')
  const res = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      temperature: 0.3,
      max_tokens: 800,
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`API error ${res.status}: ${err}`)
  }
  const data = await res.json()
  const content = data.choices?.[0]?.message?.content || ''
  return parseAnalysisResponse(content)
}

// ── Analysis Persistence ───────────────────────────────

function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0
  }
  return hash.toString(36)
}

export async function loadNoteAnalysis(noteId: string, _token: string): Promise<{ analysis: NoteAnalysis; contentHash: string } | null> {
  const { data, error } = await supabase
    .from('note_analyses')
    .select('analysis, content_hash')
    .eq('note_id', noteId)
    .maybeSingle()

  if (error) {
    console.error('Failed to load analysis:', error)
    return null
  }
  if (!data) return null

  return {
    analysis: data.analysis as NoteAnalysis,
    contentHash: data.content_hash,
  }
}

export async function saveNoteAnalysis(noteId: string, analysis: NoteAnalysis, contentHash: string, _token: string): Promise<void> {
  const { data: existing } = await supabase
    .from('note_analyses')
    .select('id')
    .eq('note_id', noteId)
    .maybeSingle()

  const record = {
    note_id: noteId,
    analysis,
    content_hash: contentHash,
    updated_at: new Date().toISOString(),
  }

  if (existing) {
    await supabase.from('note_analyses').update(record).eq('note_id', noteId)
  } else {
    const { data: user } = await supabase.auth.getUser()
    await supabase.from('note_analyses').insert({
      ...record,
      user_id: user.user?.id,
      created_at: new Date().toISOString(),
    })
  }
}

export function contentHash(note: { title: string; content: string }): string {
  return simpleHash(note.content || '')
}

export async function loadAllNoteAnalyses(): Promise<Record<string, NoteAnalysis>> {
  const { data, error } = await supabase
    .from('note_analyses')
    .select('note_id, analysis')
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('Failed to load all analyses:', error)
    return {}
  }

  const result: Record<string, NoteAnalysis> = {}
  for (const row of data) {
    result[row.note_id] = row.analysis as NoteAnalysis
  }
  return result
}