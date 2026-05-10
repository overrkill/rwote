'use client'

import { useEffect, useState, useMemo, useRef, useCallback } from 'react'
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
import Dialog from '@/components/ui/dialog'
import { useTheme } from '@/components/providers/theme-provider'
import { Cloud, AlertCircle, List, Search, Plus, X } from 'lucide-react'

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
  const [aiSummarizing, setAiSummarizing] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(280)
  const [isResizing, setIsResizing] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchModalOpen, setSearchModalOpen] = useState(false)
  const [searchFocusedIndex, setSearchFocusedIndex] = useState(0)
  const searchInputRef = useRef<HTMLInputElement>(null)

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
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (searchModalOpen) {
          setSearchModalOpen(false)
          setSearchQuery('')
          setSearchFocusedIndex(0)
        } else {
          setSearchModalOpen(true)
          setTimeout(() => searchInputRef.current?.focus(), 100)
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [searchModalOpen])

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
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setSidebarOpen(false)
    }
  }

  const handleUpdateNote = async (updated: Note) => {
    let finalTitle = updated.title
    let finalTags = [...updated.tags]

    if (aiSettings.provider !== 'disabled' && updated.title.trim() && !updated.content) {
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

  const searchResults = useMemo(() => {
    if (!searchQuery) return notes
    const q = searchQuery.toLowerCase()
    return notes.filter(n =>
      n.title.toLowerCase().includes(q) ||
      (n.content && n.content.toLowerCase().includes(q)) ||
      (n.tags && n.tags.some(t => t.toLowerCase().includes(q)))
    )
  }, [notes, searchQuery])

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
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden p-1.5 rounded-md transition-colors"
            style={{ color: 'var(--text-primary)', backgroundColor: 'var(--surface-alt)' }}
            title="Notes"
          >
            <List size={18} />
          </button>
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
            onClick={() => setSearchModalOpen(true)}
            className="p-2 rounded-md transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            title="Search (Ctrl+K)"
          >
            <Search size={16} strokeWidth={2} />
          </button>

          <button
            onClick={handleNewNote}
            className="p-2 rounded-md transition-colors"
            style={{ color: 'var(--text-primary)' }}
            title="New Note"
          >
            <Plus size={18} strokeWidth={2} />
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
        <div className="hidden md:block" style={{ width: sidebarWidth, flexShrink: 0, position: 'relative' }}>
          <NoteSidebar
            notes={notes}
            selectedId={selectedNoteId}
            onSelect={handleSelectNote}
            searchQuery={searchQuery}
          />
          <div
            className="absolute top-0 right-0 h-full w-1 cursor-ew-resize"
            style={{
              backgroundColor: isResizing ? 'var(--accent)' : 'transparent',
            }}
            onMouseDown={(e) => {
              e.preventDefault()
              setIsResizing(true)
            }}
          />
        </div>

        {sidebarOpen && (
          <div className="fixed inset-0 z-30 md:hidden" onClick={() => setSidebarOpen(false)} style={{ backgroundColor: 'rgba(0,0,0,0.4)' }} />
        )}
        <div
          className={`fixed inset-y-0 left-0 z-40 md:hidden transform transition-transform duration-300 ease-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
          style={{ width: '280px', backgroundColor: 'var(--surface)' }}
        >
          <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Notes</span>
            <button onClick={() => setSidebarOpen(false)} className="p-1 text-xl" style={{ color: 'var(--text-secondary)' }}>
              ×
            </button>
          </div>
          <div className="h-[calc(100%-57px)]">
            <NoteSidebar
              notes={notes}
              selectedId={selectedNoteId}
              onSelect={handleSelectNote}
              searchQuery={searchQuery}
            />
          </div>
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

      <Dialog
        open={searchModalOpen}
        onOpenChange={(open) => {
          setSearchModalOpen(open)
          if (!open) { setSearchQuery(''); setSearchFocusedIndex(0) }
        }}
        title="Search notes"
      >
        <div
          className="p-4"
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setSearchFocusedIndex(i => Math.min(i + 1, searchResults.length - 1))
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              setSearchFocusedIndex(i => Math.max(i - 1, 0))
            } else if (e.key === 'Enter' && searchResults[searchFocusedIndex]) {
              handleSelectNote(searchResults[searchFocusedIndex])
              setSearchModalOpen(false)
              setSearchQuery('')
              setSearchFocusedIndex(0)
            }
          }}
        >
          <div className="relative mb-4">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setSearchFocusedIndex(0) }}
              placeholder="Search notes..."
              autoFocus
              className="w-full h-10 pl-9 pr-4 text-sm rounded-lg outline-none transition-all"
              style={{ backgroundColor: 'var(--surface-alt)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); setSearchFocusedIndex(0); searchInputRef.current?.focus() }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-black/10"
                style={{ color: 'var(--text-tertiary)' }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto space-y-1 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {searchResults.length === 0 ? (
              <p className="text-sm text-center py-8" style={{ color: 'var(--text-tertiary)' }}>
                {searchQuery ? 'No notes match' : 'Type to search'}
              </p>
            ) : (
              searchResults.map((note, i) => (
                <div
                  key={note.id}
                  onClick={() => { handleSelectNote(note); setSearchModalOpen(false); setSearchQuery(''); setSearchFocusedIndex(0) }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors"
                  style={{
                    backgroundColor: i === searchFocusedIndex ? 'var(--surface-alt)' : 'transparent',
                  }}
                  onMouseEnter={() => setSearchFocusedIndex(i)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                      {note.pinned && <span className="mr-1" style={{ color: 'var(--accent)' }}>📌</span>}
                      {note.title || 'Untitled'}
                    </div>
                    {note.content && (
                      <div className="text-xs truncate mt-0.5" style={{ color: 'var(--text-secondary)' }}>{note.content}</div>
                    )}
                  </div>
                  <span className="text-xs shrink-0" style={{ color: 'var(--text-tertiary)' }}>
                    {new Date(note.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </Dialog>
    </div>
  )
}