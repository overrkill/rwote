'use client'

import { useEffect, useState, useMemo } from 'react'
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
import Avatar from '@/components/ui/avatar'
import type { Note, SubscriptionStatus, User, AiSettings } from '@/lib/types'
import { NoteList } from '@/components/notes'
import SearchBar from '@/components/notes/search-bar'
import TagFilter from '@/components/notes/tag-filter'
import SubscriptionModal from '@/components/ui/subscription-modal'
import NoteModal from '@/components/ui/note-modal'
import AiSettingsModal from '@/components/ui/ai-settings-modal'
import { useTheme } from '@/components/providers/theme-provider'
import { Cloud, AlertCircle, Menu, Layers, Sun, Download, LogOut, X } from 'lucide-react'
import Tooltip from '@/components/ui/tooltip'

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
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle')
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null)
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null)
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)
  const [showThemeModal, setShowThemeModal] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [user, setUser] = useState<User | null>(getStoredUser())
  const [aiSettings, setAiSettingsState] = useState<AiSettings>({ provider: 'disabled', ollamaUrl: 'http://localhost:11434', ollamaModel: 'llama3.2' })
  const [aiEnabled, setAiEnabled] = useState(false)
  const [showAiSettings, setShowAiSettings] = useState(false)
  const [aiSummarizing, setAiSummarizing] = useState(false)
  const [themeMenuOpen, setThemeMenuOpen] = useState(false)

  function formatSyncTime(timestamp: number | null): string {
    if (!timestamp) return ''
    const diff = Date.now() - timestamp
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins === 1) return '1m ago'
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours === 1) return '1h ago'
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days === 1) return '1d ago'
    return `${days}d ago`
  }

  const themeList = [
    { id: 'paper_dark', name: 'Paper Dark' },
    { id: 'tokyonight', name: 'Tokyo Night' },
    { id: 'tokyonight_light', name: 'Tokyo Night Light' },
    { id: 'catppuccin', name: 'Catppuccin' },
    { id: 'catppuccin_light', name: 'Catppuccin Latte' },
    { id: 'nord', name: 'Nord' },
    { id: 'nord_light', name: 'Nord Frost' },
    { id: 'ayu', name: 'Ayu Dark' },
    { id: 'ayu_light', name: 'Ayu Mirage' },
    { id: 'monokai', name: 'Monokai' },
    { id: 'monokai_light', name: 'Monokai Pro' },
  ]

  const availableTags = useMemo(() => {
    const tagsFromNotes = notes.flatMap(n => n.tags.filter(t => t.length > 0))
    return [...new Set(tagsFromNotes)].sort()
  }, [notes])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuOpen && !(e.target as HTMLElement).closest('.hamburger-menu')) {
        setMenuOpen(false)
        setThemeMenuOpen(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [menuOpen])

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

    setSyncStatus('syncing')
    try {
      await saveNote(note, token)
      setSyncStatus('synced')
      setLastSyncedAt(Date.now())
    } catch (e) {
      console.error('Failed to sync note:', e)
      setSyncStatus('error')
    }
  }

  const deleteFromCloud = async (id: string): Promise<boolean> => {
    if (!subscription?.can_sync) return false
    const token = await getAuthToken()
    if (!token) return false

    setSyncStatus('syncing')
    try {
      await cloudDeleteNote(id, token)
      setSyncStatus('synced')
      setLastSyncedAt(Date.now())
      return true
    } catch (e) {
      console.error('Failed to delete from cloud:', e)
      setSyncStatus('error')
      return false
    }
  }

  const handleSaveNote = async (title: string, content: string, tags: string[]) => {
    const token = await getAuthToken()
    if (!token || !subscription?.can_sync) {
      setShowSubscriptionModal(true)
      return
    }

    let finalTitle = title
    let finalContent = content
    let finalTags = tags

    if (aiEnabled && aiSettings.provider !== 'disabled' && title.trim()) {
      setAiSummarizing(true)
      try {
        let result
        if (aiSettings.provider === 'groq') {
          result = await summarizeUsingCloud(title, token)
        } else {
          result = await summarizeUsingLocal(title, aiSettings.ollamaUrl, aiSettings.ollamaModel)
        }
        finalTitle = result.summary
        if (result.tags.length > 0) {
          finalTags = [...new Set([...finalTags, ...result.tags])]
        }
      } catch (e) {
        console.error('AI summarization failed:', e)
      }
      setAiSummarizing(false)
    }

    if (editingNote) {
      const updatedNote: Note = {
        ...editingNote,
        title: finalTitle,
        content: finalContent,
        tags: finalTags,
        updated_at: new Date().toISOString()
      }
      const updatedNotes = notes.map((n) =>
        n.id === editingNote.id ? updatedNote : n
      )
      setNotes(updatedNotes)
      syncToCloud(updatedNote)
      setEditingNote(null)
    } else {
      const newNote: Note = {
        id: crypto.randomUUID(),
        title: finalTitle,
        content: finalContent,
        tags: finalTags,
        pinned: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      setNotes([newNote, ...notes])
      syncToCloud(newNote)
    }
    setShowForm(false)
  }

  const handleDelete = async (id: string) => {
    const previousNotes = [...notes]
    setNotes(notes.filter((n) => n.id !== id))
    
    const success = await deleteFromCloud(id)
    if (!success) {
      setNotes(previousNotes)
    }
  }

  const handleTogglePin = (id: string) => {
    const noteToUpdate = notes.find((n) => n.id === id)
    if (!noteToUpdate) return
    
    const updatedNote = { ...noteToUpdate, pinned: !noteToUpdate.pinned, updated_at: new Date().toISOString() }
    const updatedNotes = notes.map((n) => n.id === id ? updatedNote : n)
    setNotes(updatedNotes)
    syncToCloud(updatedNote)
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
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl" style={{ fontFamily: "'Grand Hotel', cursive", color: 'var(--text-primary)' }}>Rwote</h1>
          <div className="flex items-center gap-2 relative">
            {syncStatus === 'syncing' && (
              <span className="text-xs animate-pulse" style={{ color: 'var(--text-tertiary)' }}>Syncing...</span>
            )}
            {syncStatus === 'synced' && lastSyncedAt && (
              <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-tertiary)' }}>
                <Cloud size={12} strokeWidth={2} />
                {formatSyncTime(lastSyncedAt)}
              </span>
            )}
            {syncStatus === 'error' && (
              <span className="text-xs flex items-center gap-1" style={{ color: '#ef4444' }} title="Sync failed, will retry">
                <AlertCircle size={12} strokeWidth={2} />
              </span>
            )}
            {aiSummarizing && (
              <span className="text-xs animate-pulse" style={{ color: '#3b82f6' }}>AI...</span>
            )}
            <button
              onClick={() => setAiEnabled(!aiEnabled)}
              className="dashboard-btn ai-btn"
              style={{ 
                backgroundColor: aiEnabled ? 'rgba(34, 197, 94, 0.2)' : 'transparent', 
                color: aiEnabled ? '#22c55e' : 'var(--text-secondary)'
              }}
              onMouseEnter={(e) => {
                if (!aiEnabled) {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--surface-alt)'
                  ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)'
                }
              }}
              onMouseLeave={(e) => {
                if (!aiEnabled) {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'
                  ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)'
                }
              }}
              >
              <Tooltip content={aiEnabled ? 'AI Summarization ON' : 'AI Summarization OFF'} position="bottom">
                <span style={{ fontSize: '12px', fontWeight: 600 }}>ai</span>
              </Tooltip>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setMenuOpen(!menuOpen)
              }}
              className="dashboard-btn"
              style={{ color: 'var(--text-primary)' }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--surface-alt)'
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'
              }}
              >
              <Tooltip content="Menu" position="bottom">
                <Menu size={18} strokeWidth={1.75} />
              </Tooltip>
            </button>
            <div className={`hamburger-menu absolute right-0 top-full mt-2 w-56 rounded-lg shadow-lg ${menuOpen ? 'block' : 'hidden'}`} style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="p-3 flex items-center gap-3" style={{ borderBottom: '1px solid var(--border)' }}>
                <Avatar user={user} size={36} />
                <div className="min-w-0 flex-1 overflow-hidden">
                  <div className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{user?.name || 'User'}</div>
                  <div className="text-xs truncate" style={{ color: 'var(--text-secondary)' }} title={user?.email}>
                    {user?.email}
                  </div>
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
                <Cloud size={18} strokeWidth={1.75} />
                <span className="text-sm" style={{ 
                  color: subscription?.subscription_status === 'paid' ? '#22c55e' : 
                         subscription?.subscription_status === 'trial' ? '#f59e0b' : 
                         subscription?.subscription_status === 'expired' ? '#ef4444' : 'var(--text-secondary)'
                }}>
                  {subscription?.subscription_status === 'paid' && 'Pro'}
                  {subscription?.subscription_status === 'trial' && `Trial: ${subscription.days_left} days left`}
                  {subscription?.subscription_status === 'expired' && 'Expired'}
                </span>
              </button>
              <button
                onClick={() => {
                  setShowAiSettings(true)
                  setMenuOpen(false)
                }}
                className="w-full px-4 py-3 text-left text-sm flex items-center gap-3"
                style={{ color: 'var(--text-primary)' }}
              >
                <Layers size={18} strokeWidth={2} />
                <span>AI Settings</span>
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false)
                  setShowThemeModal(true)
                }}
                className="w-full px-4 py-3 text-left text-sm flex items-center gap-3"
                style={{ color: 'var(--text-primary)' }}
              >
                <Sun size={18} strokeWidth={1.75} />
                <span>Theme</span>
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
                <Download size={18} strokeWidth={2} />
                <span>Export Notes</span>
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
                  <LogOut size={18} strokeWidth={2} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {subscription?.subscription_status === 'trial' && subscription.days_left !== undefined && subscription.days_left > 0 && (
        <div className="px-4 py-2" style={{ backgroundColor: '#fef3c7', borderBottom: '1px solid #fcd34d' }}>
<div className="max-w-7xl mx-auto flex items-center justify-between">
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

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-3 mb-6">
          <div className="flex-1">
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
          </div>
          <TagFilter
            tags={availableTags}
            activeTags={activeTags}
            onChange={setActiveTags}
          />
        </div>

        <button
          onClick={() => setShowForm(true)}
          className="w-full mb-6 py-3 text-center border-2 border-dashed rounded-lg transition-colors"
          style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
        >
          + Add Note
        </button>

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
            setShowForm(true)
          }}
          onDelete={handleDelete}
          onTogglePin={handleTogglePin}
          onCopy={() => {
            // Copy is handled internally in NoteCard with clipboard API
          }}
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

      {showThemeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => setShowThemeModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl shadow-xl overflow-hidden"
            style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
              <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>Theme</h3>
              <button
                onClick={() => setShowThemeModal(false)}
                className="p-1 rounded hover:bg-black/10"
                style={{ color: 'var(--text-secondary)' }}
              >
                <X size={18} strokeWidth={2} />
              </button>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 gap-3">
                {themeList.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setTheme(t.id)
                      setShowThemeModal(false)
                    }}
                    className="px-4 py-3 text-sm rounded-lg transition-colors text-left"
                    style={{
                      backgroundColor: themeId === t.id ? 'var(--surface-alt)' : 'transparent',
                      fontWeight: themeId === t.id ? 500 : 400,
                      color: 'var(--text-primary)',
                      border: themeId === t.id ? '2px solid var(--accent)' : '1px solid var(--border)'
                    }}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {(showForm || editingNote) && (
        <NoteModal
          note={editingNote}
          onSave={handleSaveNote}
          onClose={() => {
            setShowForm(false)
            setEditingNote(null)
          }}
        />
      )}
    </div>
  )
}
