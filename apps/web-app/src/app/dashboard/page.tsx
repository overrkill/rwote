'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  getAuthToken,
  getAuthUser,
  getStoredUser,
  onAuthStateChange,
  signOut,
  loadNotes,
  saveNote,
  deleteNote as cloudDeleteNote,
  getSubscriptionStatus,
  subscribeToPlan,
  getAiSettings,
  setAiSettings,
  summarizeUsingCloud,
  summarizeUsingLocal
} from '@/lib/supabase'
import type { Note, SubscriptionStatus, User, AiSettings } from '@/lib/types'
import { NoteList, NoteForm } from '@/components/notes'
import SearchBar from '@/components/notes/search-bar'
import TagFilter from '@/components/notes/tag-filter'
import SubscriptionModal from '@/components/ui/subscription-modal'
import AiSettingsModal from '@/components/ui/ai-settings-modal'
import { useTheme } from '@/components/providers/theme-provider'

const DEFAULT_TAGS = [
  'uncategorized', 'general', 'arrays', 'strings', 'sliding-window', 'prefix-sum',
  'hashing', 'trees', 'graphs', 'dp', 'sorting',
  'backtracking', 'binary-search', 'heaps', 'tries'
]

export default function DashboardPage() {
  const router = useRouter()
  const { theme, themeId, setTheme } = useTheme()
  const [notes, setNotes] = useState<Note[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTags, setActiveTags] = useState<string[]>([])
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null)
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [user, setUser] = useState<User | null>(getStoredUser())
  const [aiSettings, setAiSettingsState] = useState<AiSettings>({ provider: 'disabled', ollamaUrl: 'http://localhost:11434', ollamaModel: 'llama3.2' })
  const [aiEnabled, setAiEnabled] = useState(false)
  const [showAiSettings, setShowAiSettings] = useState(false)
  const [aiSummarizing, setAiSummarizing] = useState(false)
  const [themeMenuOpen, setThemeMenuOpen] = useState(false)

  const themeList = [
    { id: 'paper_dark', name: 'Paper Dark' },
    { id: 'tokyonight', name: 'Tokyo Night' },
    { id: 'catppuccin', name: 'Catppuccin' },
    { id: 'nord', name: 'Nord' },
    { id: 'monokai', name: 'Monokai' },
    { id: 'light', name: 'Light' },
  ]

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuOpen && !(e.target as HTMLElement).closest('.hamburger-menu')) {
        setMenuOpen(false)
      }
      if (themeMenuOpen && !(e.target as HTMLElement).closest('[title="Theme"]') && !(e.target as HTMLElement).closest('.theme-dropdown')) {
        setThemeMenuOpen(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [menuOpen, themeMenuOpen])

  useEffect(() => {
    const { data: { subscription: authSubscription } } = onAuthStateChange((user) => {
      setUser(user)
      if (!user) {
        router.push('/auth/login')
      }
    })

    async function init() {
      const token = await getAuthToken()
      if (!token) {
        router.push('/auth/login')
        return
      }

      const currentUser = await getAuthUser()
      if (!currentUser) {
        router.push('/auth/login')
        return
      }
      setUser(currentUser)

      await loadData(token)
    }

    init()

    return () => {
      authSubscription?.unsubscribe()
    }
  }, [router])

  async function loadData(token: string) {
      try {
        setLoading(true)
        const sub = await getSubscriptionStatus(token)
        setSubscription(sub)

        const ai = getAiSettings()
        setAiSettingsState(ai)
        setAiEnabled(ai.provider !== 'disabled')

        if (sub.can_sync) {
          const { notes: cloudNotes, error } = await loadNotes(token)
          
          if (!error && cloudNotes) {
            setNotes(cloudNotes)
            setLoading(false)
          }
        } else {
          setShowSubscriptionModal(true)
          setLoading(false)
        }
      } catch (e) {
        console.error('Failed to load data:', e)
      } finally{
                  setLoading(false)
      }
    }
    
  const syncToCloud = async (note: Note) => {
    if (!subscription?.can_sync) return
    const token = await getAuthToken()
    if (!token) return

    try {
      await saveNote(note, token)
    } catch (e) {
      console.error('Failed to sync note:', e)
    }
  }

  const deleteFromCloud = async (id: string) => {
    if (!subscription?.can_sync) return
    const token = await getAuthToken()
    if (!token) return

    try {
      await cloudDeleteNote(id, token)
    } catch (e) {
      console.error('Failed to delete from cloud:', e)
    }
  }

  const handleSaveNote = async (text: string, noteText: string, tag: string) => {
    const token = await getAuthToken()
    if (!token || !subscription?.can_sync) {
      setShowSubscriptionModal(true)
      return
    }

    let finalText = text
    let finalNote = noteText

    if (aiEnabled && aiSettings.provider !== 'disabled' && text.trim()) {
      setAiSummarizing(true)
      try {
        let result
        if (aiSettings.provider === 'groq') {
          result = await summarizeUsingCloud(text, token)
        } else {
          result = await summarizeUsingLocal(text, aiSettings.ollamaUrl, aiSettings.ollamaModel)
        }
        finalText = result.summary
        if (result.tags.length > 0 && tag === 'uncategorized') {
          const matchedTag = DEFAULT_TAGS.find(t => result.tags.includes(t))
          if (matchedTag) {
            tag = matchedTag
          }
        }
      } catch (e) {
        console.error('AI summarization failed:', e)
      }
      setAiSummarizing(false)
    }

    if (editingNote) {
      const updatedNote: Note = {
        ...editingNote,
        text: finalText,
        note: finalNote,
        tag,
        updated_at: Date.now()
      }
      const updatedNotes = notes.map((n) =>
        n.id === editingNote.id ? updatedNote : n
      )
      setNotes(updatedNotes)
      syncToCloud(updatedNote)
      setEditingNote(null)
    } else {
      const newNote: Note = {
        id: String(Date.now()),
        text: finalText,
        note: finalNote,
        tag,
        date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        pinned: false,
        updated_at: Date.now(),
      }
      setNotes([newNote, ...notes])
      syncToCloud(newNote)
    }
    setShowForm(false)
  }

  const handleDelete = (id: string) => {
    setNotes(notes.filter((n) => n.id !== id))
    deleteFromCloud(id)
  }

  const handleTogglePin = (id: string) => {
    const updatedNotes = notes.map((n) =>
      n.id === id ? { ...n, pinned: !n.pinned, updated_at: Date.now() } : n
    )
    setNotes(updatedNotes)
    syncToCloud(updatedNotes.find((n) => n.id === id)!)
  }

  const handleSubscribe = async (plan: string) => {
    const token = await getAuthToken()
    if (!token) return

    try {
      await subscribeToPlan(plan, token)
      const sub = await getSubscriptionStatus(token)
      setSubscription(sub)
      
      if (sub.can_sync) {
        setShowSubscriptionModal(false)
        setSyncing(true)
        const { notes: cloudNotes, error } = await loadNotes(token)
        if (!error && cloudNotes) {
          setNotes(cloudNotes)
        }
        setSyncing(false)
      }
    } catch (e) {
      console.error('Failed to subscribe:', e)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg)' }}>
        <div style={{ color: 'var(--text-secondary)' }}>Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>
      <header className="px-4 py-3 sticky top-0 z-30" style={{ backgroundColor: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl" style={{ fontFamily: "'Grand Hotel', cursive", color: 'var(--text-primary)' }}>Rwote</h1>
          <div className="flex items-center gap-2 relative">
            {syncing && (
              <span className="text-xs animate-pulse" style={{ color: 'var(--text-tertiary)' }}>Syncing...</span>
            )}
            {aiSummarizing && (
              <span className="text-xs animate-pulse" style={{ color: '#3b82f6' }}>AI...</span>
            )}
            <button
              onClick={() => setAiEnabled(!aiEnabled)}
              className="p-2 rounded-lg transition-colors"
              style={{ backgroundColor: aiEnabled ? 'rgba(34, 197, 94, 0.2)' : 'transparent', color: aiEnabled ? '#22c55e' : 'var(--text-secondary)' }}
              title={aiEnabled ? 'AI Summarization ON' : 'AI Summarization OFF'}
            >
              ✨
            </button>
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setThemeMenuOpen(!themeMenuOpen)
                }}
                className="p-2 rounded-lg transition-colors"
                style={{ color: 'var(--text-primary)' }}
                title="Theme"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="5"/>
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                </svg>
              </button>
              {themeMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 rounded-lg shadow-lg overflow-hidden z-50" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
                  {themeList.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setTheme(t.id)
                        setThemeMenuOpen(false)
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
            <button
              onClick={(e) => {
                e.stopPropagation()
                setMenuOpen(!menuOpen)
              }}
              className="p-2 rounded-lg transition-colors"
              style={{ color: 'var(--text-primary)' }}
              title="Menu"
            >
              ☰
            </button>
            <div className={`hamburger-menu absolute right-0 top-full mt-2 w-56 rounded-lg shadow-lg ${menuOpen ? 'block' : 'hidden'}`} style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="p-3" style={{ borderBottom: '1px solid var(--border)' }}>
                <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{user?.name || user?.email || 'User'}</div>
                <div className="text-xs capitalize" style={{ color: 'var(--text-secondary)' }}>
                  {subscription?.subscription_status === 'paid' && 'Pro Member'}
                  {subscription?.subscription_status === 'trial' && `Trial (${subscription.days_left} days left)`}
                  {subscription?.subscription_status === 'expired' && 'Expired'}
                </div>
              </div>
              <button
                onClick={() => {
                  setShowSubscriptionModal(true)
                  setMenuOpen(false)
                }}
                className="w-full px-4 py-3 text-left text-sm flex items-center gap-3"
                style={{ color: 'var(--text-primary)' }}
              >
                🔄 <span>Subscription</span>
              </button>
              <button
                onClick={() => {
                  setShowAiSettings(true)
                  setMenuOpen(false)
                }}
                className="w-full px-4 py-3 text-left text-sm flex items-center gap-3"
                style={{ color: 'var(--text-primary)' }}
              >
                ✨ <span>AI Settings</span>
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false)
                  const data = JSON.stringify(notes, null, 2)
                  const blob = new Blob([data], { type: 'application/json' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `rwote-notes-${new Date().toISOString().split('T')[0]}.json`
                  a.click()
                  URL.revokeObjectURL(url)
                }}
                className="w-full px-4 py-3 text-left text-sm flex items-center gap-3"
                style={{ color: 'var(--text-primary)' }}
              >
                📥 <span>Export Notes</span>
              </button>
              <div style={{ borderTop: '1px solid var(--border)' }}>
                <button
                  onClick={() => {
                    handleSignOut()
                    setMenuOpen(false)
                  }}
                  className="w-full px-4 py-3 text-left text-sm flex items-center gap-3"
                  style={{ color: 'var(--text-primary)' }}
                >
                  🚪 <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {subscription?.subscription_status === 'trial' && subscription.days_left !== undefined && subscription.days_left > 0 && (
        <div className="px-4 py-2" style={{ backgroundColor: '#fef3c7', borderBottom: '1px solid #fcd34d' }}>
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <p className="text-sm" style={{ color: '#92400e' }}>
              ⏳ Trial period — {subscription.days_left} day{subscription.days_left !== 1 ? 's' : ''} remaining
            </p>
            <button
              onClick={() => setShowSubscriptionModal(true)}
              className="text-xs px-3 py-1 rounded-full transition-colors"
              style={{ backgroundColor: '#f59e0b', color: 'white' }}
            >
              Upgrade Now
            </button>
          </div>
        </div>
      )}

      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex gap-3 mb-6">
          <div className="flex-1">
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
          </div>
          <TagFilter
            tags={DEFAULT_TAGS}
            activeTags={activeTags}
            onChange={setActiveTags}
          />
        </div>

        {(showForm || editingNote) && (
          <div className="mb-6">
            <NoteForm
              note={editingNote || undefined}
              onSave={handleSaveNote}
              onCancel={() => {
                setShowForm(false)
                setEditingNote(null)
              }}
            />
          </div>
        )}

        {!showForm && !editingNote && (
          <button
            onClick={() => setShowForm(true)}
            className="w-full mb-6 py-3 text-center border-2 border-dashed border-border-light dark:border-border-dark rounded-lg text-secondary-light dark:text-secondary-dark hover:border-border-focus-light dark:hover:border-border-focus-dark transition-colors"
          >
            + Add Note
          </button>
        )}

        <div className="flex items-center justify-between mb-4">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {notes.length} {notes.length === 1 ? 'note' : 'notes'}
            {subscription?.can_sync && (
              <span className="ml-2" style={{ color: 'var(--text-tertiary)' }}>• Synced</span>
            )}
          </p>
        </div>

        <NoteList
          notes={notes}
          searchQuery={searchQuery}
          activeTags={activeTags}
          onEdit={(note) => {
            setEditingNote(note)
            setShowForm(false)
          }}
          onDelete={handleDelete}
          onTogglePin={handleTogglePin}
        />
      </main>

      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => {
          if (!subscription?.can_sync) return
          setShowSubscriptionModal(false)
        }}
        subscription={subscription}
        onSubscribe={handleSubscribe}
      />

      <AiSettingsModal
        isOpen={showAiSettings}
        onClose={() => setShowAiSettings(false)}
        settings={aiSettings}
        onSave={(settings) => {
          setAiSettings(settings)
          setAiSettingsState(settings)
          setAiEnabled(settings.provider !== 'disabled')
        }}
      />
    </div>
  )
}
