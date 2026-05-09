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
  summarizeUsingLocal,
  loadUserSettings,
  saveUserSettings,
  type UserSettings
} from '@/lib/supabase'
import Avatar from '@/components/ui/avatar'
import type { Note, SubscriptionStatus, User, AiSettings } from '@/lib/types'
import NoteSidebar from '@/components/notes/note-sidebar'
import NoteDetail from '@/components/notes/note-detail'
import SubscriptionModal from '@/components/ui/subscription-modal'
import SettingsPanel from '@/components/ui/settings-panel'
import { useTheme } from '@/components/providers/theme-provider'
import { Cloud, AlertCircle } from 'lucide-react'

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
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [user, setUser] = useState<User | null>(getStoredUser())
  const [aiSettings, setAiSettingsState] = useState<AiSettings>({ provider: 'disabled', ollamaUrl: 'http://localhost:11434', ollamaModel: 'llama3.2' })
  const [aiEnabled, setAiEnabled] = useState(false)
  const [aiSummarizing, setAiSummarizing] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(280)
  const [isResizing, setIsResizing] = useState(false)

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
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return
      const newWidth = Math.min(Math.max(e.clientX, 200), 500)
      setSidebarWidth(newWidth)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'ew-resize'
      document.body.style.userSelect = 'none'
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isResizing])

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

      const userSettings = await loadUserSettings()
      setAiSettingsState({
        provider: userSettings.aiProvider,
        ollamaUrl: userSettings.aiOllamaUrl,
        ollamaModel: userSettings.aiOllamaModel,
      })
      setAiEnabled(userSettings.aiProvider !== 'disabled')
      setTheme(userSettings.theme)

      const sub = await getSubscriptionStatus(token)
      setSubscription(sub)

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
            onClick={() => setSettingsOpen(true)}
            className="p-1 rounded-md transition-colors"
            style={{ color: 'var(--text-primary)' }}
            title="Settings"
          >
            <Avatar user={user} size={28} />
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div style={{ width: sidebarWidth, flexShrink: 0, position: 'relative' }}>
          <NoteSidebar
            notes={notes}
            selectedId={selectedNoteId}
            onSelect={handleSelectNote}
            onNew={handleNewNote}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
          <div
            className="absolute top-0 right-0 h-full w-1 cursor-ew-resize transition-colors"
            style={{
              backgroundColor: isResizing ? 'var(--accent)' : 'transparent',
            }}
            onMouseDown={(e) => {
              e.preventDefault()
              setIsResizing(true)
            }}
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

      <SettingsPanel
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        user={user}
        subscription={subscription}
        aiSettings={aiSettings}
        currentTheme={themeId}
        themeList={themeList}
        onAiSettingsChange={async (settings) => {
          setAiSettings(settings)
          setAiSettingsState(settings)
          setAiEnabled(settings.provider !== 'disabled')
          await saveUserSettings({
            aiProvider: settings.provider,
            aiOllamaUrl: settings.ollamaUrl,
            aiOllamaModel: settings.ollamaModel,
          })
        }}
        onThemeChange={async (newThemeId) => {
          setTheme(newThemeId)
          await saveUserSettings({ theme: newThemeId })
        }}
        onSubscriptionOpen={() => setShowSubscriptionModal(true)}
        onExport={() => {
          const data = JSON.stringify(notes, null, 2)
          const blob = new Blob([data], { type: 'application/json' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `rwote-backup-${new Date().toISOString().split('T')[0]}.json`
          a.click()
          URL.revokeObjectURL(url)
        }}
        onSignOut={handleSignOut}
      />
    </div>
  )
}