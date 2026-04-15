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
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-bg-dark">
        <div className="text-secondary-light dark:text-secondary-dark">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-bg-dark">
      <header className="bg-surface-light dark:bg-surface-dark border-b border-border-light dark:border-border-dark px-4 py-3 sticky top-0 z-30">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl text-primary-light dark:text-primary-dark" style={{ fontFamily: "'Grand Hotel', cursive" }}>Rwote</h1>
          <div className="flex items-center gap-2 relative">
            {syncing && (
              <span className="text-xs text-tertiary-light dark:text-tertiary-dark animate-pulse">Syncing...</span>
            )}
            {aiSummarizing && (
              <span className="text-xs text-blue-600 dark:text-blue-400 animate-pulse">AI...</span>
            )}
            <button
              onClick={() => setAiEnabled(!aiEnabled)}
              className={`p-2 rounded-lg transition-colors ${
                aiEnabled
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-secondary-light dark:text-secondary-dark'
              }`}
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
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Theme"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="5"/>
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                </svg>
              </button>
              {themeMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-[#242428] border border-[#d8d8d8] dark:border-[#3a3a40] rounded-lg shadow-lg overflow-hidden z-50">
                  {themeList.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setTheme(t.id)
                        setThemeMenuOpen(false)
                      }}
                      className={`w-full px-4 py-2.5 text-left text-sm flex items-center justify-between hover:bg-gray-100 dark:hover:bg-[#2e2e34] transition-colors ${
                        themeId === t.id ? 'bg-gray-100 dark:bg-[#2e2e34] font-medium' : ''
                      } text-gray-900 dark:text-gray-100`}
                    >
                      <span>{t.name}</span>
                      {themeId === t.id && <span className="text-gray-400">✓</span>}
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
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Menu"
            >
              ☰
            </button>
            <div className={`hamburger-menu absolute right-0 top-full mt-2 w-56 bg-white dark:bg-[#2a2a28] rounded-lg shadow-lg border border-border-light dark:border-border-dark ${menuOpen ? 'block' : 'hidden'}`}>
              <div className="p-3 border-b border-border-light dark:border-border-dark">
                <div className="text-sm font-medium text-primary-light dark:text-primary-dark">{user?.name || user?.email || 'User'}</div>
                <div className="text-xs text-secondary-light dark:text-secondary-dark capitalize">
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
                className="w-full px-4 py-3 text-left text-sm text-primary-light dark:text-primary-dark hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-3"
              >
                🔄 <span>Subscription</span>
              </button>
              <button
                onClick={() => {
                  setShowAiSettings(true)
                  setMenuOpen(false)
                }}
                className="w-full px-4 py-3 text-left text-sm text-primary-light dark:text-primary-dark hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-3"
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
                className="w-full px-4 py-3 text-left text-sm text-primary-light dark:text-primary-dark hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-3"
              >
                📥 <span>Export Notes</span>
              </button>
              <div className="border-t border-border-light dark:border-border-dark">
                <button
                  onClick={() => {
                    handleSignOut()
                    setMenuOpen(false)
                  }}
                  className="w-full px-4 py-3 text-left text-sm text-primary-light dark:text-primary-dark hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-3"
                >
                  🚪 <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {subscription?.subscription_status === 'trial' && subscription.days_left !== undefined && subscription.days_left > 0 && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <p className="text-sm text-amber-800">
              ⏳ Trial period — {subscription.days_left} day{subscription.days_left !== 1 ? 's' : ''} remaining
            </p>
            <button
              onClick={() => setShowSubscriptionModal(true)}
              className="text-xs px-3 py-1 bg-amber-500 text-white rounded-full hover:bg-amber-600 transition-colors"
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
          <p className="text-sm text-secondary-light dark:text-secondary-dark">
            {notes.length} {notes.length === 1 ? 'note' : 'notes'}
            {subscription?.can_sync && (
              <span className="ml-2 text-tertiary-light dark:text-tertiary-dark">• Synced</span>
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
