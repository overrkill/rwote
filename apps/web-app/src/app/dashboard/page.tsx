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
import NoteSidebar from '@/components/notes/note-sidebar'
import NoteDetail from '@/components/notes/note-detail'
import SubscriptionModal from '@/components/ui/subscription-modal'
import AiSettingsModal from '@/components/ui/ai-settings-modal'
import { useTheme } from '@/components/providers/theme-provider'
import { Cloud, AlertCircle, Menu, Layers, Sun, Download, LogOut, X } from 'lucide-react'
import Tooltip from '@/components/ui/tooltip'

export default function DashboardPage() {
  const router = useRouter()
  const { themeId, setTheme } = useTheme()
  const [notes, setNotes] = useState<Note[]>([])
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuOpen && !(e.target as HTMLElement).closest('.hamburger-menu')) {
        setMenuOpen(false)
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
          if (cloudNotes.length > 0) {
            setSelectedNoteId(cloudNotes[0].id)
          }
        }
      } else {
        setShowSubscriptionModal(true)
      }
    } catch (e) {
      console.error('Failed to load data:', e)
    } finally {
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

  const handleNewNote = () => {
    const newNote: Note = {
      id: crypto.randomUUID(),
      title: '',
      content: '',
      tags: [],
      pinned: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    setNotes([newNote, ...notes])
    setSelectedNoteId(newNote.id)
  }

  const handleSelectNote = (note: Note) => {
    setSelectedNoteId(note.id)
  }

  const handleUpdateNote = async (updated: Note) => {
    let finalTitle = updated.title
    let finalTags = [...updated.tags]

    if (aiEnabled && aiSettings.provider !== 'disabled' && updated.title.trim() && !updated.content) {
      setAiSummarizing(true)
      try {
        let result
        const token = await getAuthToken()
        if (aiSettings.provider === 'groq' && token) {
          result = await summarizeUsingCloud(updated.title, token)
        } else {
          result = await summarizeUsingLocal(updated.title, aiSettings.ollamaUrl, aiSettings.ollamaModel)
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

    const finalNote = {
      ...updated,
      title: finalTitle,
      tags: finalTags,
      updated_at: new Date().toISOString(),
    }

    setNotes(notes.map(n => n.id === finalNote.id ? finalNote : n))
    syncToCloud(finalNote)
  }

  const handleDeleteNote = async (id: string) => {
    const previousNotes = [...notes]
    const prevSelected = selectedNoteId
    setNotes(notes.filter(n => n.id !== id))
    
    if (selectedNoteId === id) {
      const remaining = notes.filter(n => n.id !== id)
      setSelectedNoteId(remaining.length > 0 ? remaining[0].id : null)
    }
    
    const success = await deleteFromCloud(id)
    if (!success) {
      setNotes(previousNotes)
      setSelectedNoteId(prevSelected)
    }
  }

  const deleteFromCloud = async (id: string): Promise<boolean> => {
    if (!subscription?.can_sync) return false
    const token = await getAuthToken()
    if (!token) return false

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

  const handleTogglePin = (id: string) => {
    const noteToUpdate = notes.find(n => n.id === id)
    if (!noteToUpdate) return
    
    const updatedNote = { ...noteToUpdate, pinned: !noteToUpdate.pinned, updated_at: new Date().toISOString() }
    setNotes(notes.map(n => n.id === id ? updatedNote : n))
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
        const { notes: cloudNotes, error } = await loadNotes(token)
        if (!error && cloudNotes) {
          setNotes(cloudNotes)
          if (cloudNotes.length > 0) {
            setSelectedNoteId(cloudNotes[0].id)
          }
        }
      }
    } catch (e) {
      console.error('Failed to subscribe:', e)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  const selectedNote = notes.find(n => n.id === selectedNoteId) || null

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg)' }}>
        <div style={{ color: 'var(--text-secondary)' }}>Loading...</div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: 'var(--bg)' }}>
      <header className="px-4 py-2 shrink-0 flex items-center justify-between" style={{ backgroundColor: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-4">
          <h1 className="text-xl" style={{ fontFamily: "'Grand Hotel', cursive", color: 'var(--text-primary)' }}>Rwote</h1>
          
          <div className="flex items-center gap-1">
            {syncStatus === 'syncing' && (
              <span className="text-xs animate-pulse" style={{ color: 'var(--text-tertiary)' }}>Syncing...</span>
            )}
            {syncStatus === 'synced' && lastSyncedAt && (
              <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-tertiary)' }}>
                <Cloud size={12} strokeWidth={2} />
                Synced
              </span>
            )}
            {syncStatus === 'error' && (
              <span className="text-xs flex items-center gap-1" style={{ color: '#ef4444' }}>
                <AlertCircle size={12} strokeWidth={2} />
              </span>
            )}
            {aiSummarizing && (
              <span className="text-xs animate-pulse" style={{ color: '#3b82f6' }}>AI...</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 relative">
          <button
            onClick={() => setAiEnabled(!aiEnabled)}
            className="p-2 rounded-md transition-colors"
            style={{ 
              backgroundColor: aiEnabled ? 'rgba(34, 197, 94, 0.2)' : 'transparent', 
              color: aiEnabled ? '#22c55e' : 'var(--text-secondary)'
            }}
            title={aiEnabled ? 'AI ON' : 'AI OFF'}
          >
            <span style={{ fontSize: '12px', fontWeight: 600 }}>ai</span>
          </button>
          
          <button
            onClick={() => setShowAiSettings(true)}
            className="p-2 rounded-md transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            title="AI Settings"
          >
            <Layers size={16} strokeWidth={2} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation()
              setMenuOpen(!menuOpen)
            }}
            className="p-2 rounded-md transition-colors"
            style={{ color: 'var(--text-primary)' }}
          >
            <Menu size={18} strokeWidth={1.75} />
          </button>

          <div className={`hamburger-menu absolute right-0 top-full mt-2 w-56 rounded-lg shadow-lg z-50 ${menuOpen ? 'block' : 'hidden'}`} style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
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
              onClick={() => { setShowSubscriptionModal(true); setMenuOpen(false) }}
              className="w-full px-4 py-3 text-left text-sm flex items-center gap-3"
              style={{ color: 'var(--text-primary)' }}
            >
              <Cloud size={18} strokeWidth={1.75} />
              <span style={{ 
                color: subscription?.subscription_status === 'paid' ? '#22c55e' : 
                       subscription?.subscription_status === 'trial' ? '#f59e0b' : 
                       subscription?.subscription_status === 'expired' ? '#ef4444' : 'var(--text-secondary)'
              }}>
                {subscription?.subscription_status === 'paid' && 'Pro'}
                {subscription?.subscription_status === 'trial' && `Trial: ${subscription.days_left}d`}
                {subscription?.subscription_status === 'expired' && 'Expired'}
              </span>
            </button>
            <button
              onClick={() => { setMenuOpen(false); setShowThemeModal(true) }}
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
                a.download = `rwote-backup-${new Date().toISOString().split('T')[0]}.json`
                a.click()
                URL.revokeObjectURL(url)
              }}
              className="w-full px-4 py-3 text-left text-sm flex items-center gap-3"
              style={{ color: 'var(--text-primary)' }}
            >
              <Download size={18} strokeWidth={2} />
              <span>Export</span>
            </button>
            <div style={{ borderTop: '1px solid var(--border)' }}>
              <button
                onClick={() => { handleSignOut(); setMenuOpen(false) }}
                className="w-full px-4 py-3 text-left text-sm flex items-center gap-3"
                style={{ color: 'var(--text-primary)' }}
              >
                <LogOut size={18} strokeWidth={2} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-72 shrink-0">
          <NoteSidebar
            notes={notes}
            selectedId={selectedNoteId}
            onSelect={handleSelectNote}
            onNew={handleNewNote}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        </div>

        <div className="flex-1 overflow-hidden">
          {selectedNote ? (
            <NoteDetail
              note={selectedNote}
              onUpdate={handleUpdateNote}
              onDelete={handleDeleteNote}
              onTogglePin={handleTogglePin}
            />
          ) : (
            <div className="h-full flex items-center justify-center" style={{ color: 'var(--text-tertiary)' }}>
              <div className="text-center">
                <div className="text-4xl mb-4">📝</div>
                <p className="text-sm">Select a note or create a new one</p>
              </div>
            </div>
          )}
        </div>
      </div>

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
    </div>
  )
}