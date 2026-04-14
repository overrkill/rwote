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
  subscribeToPlan
} from '@/lib/supabase'
import type { Note, SubscriptionStatus, User } from '@/lib/types'
import { NoteList, NoteForm } from '@/components/notes'
import SearchBar from '@/components/notes/search-bar'
import TagFilter from '@/components/notes/tag-filter'
import SubscriptionModal from '@/components/ui/subscription-modal'
import { useTheme } from '@/components/providers/theme-provider'

const DEFAULT_TAGS = [
  'uncategorized', 'general', 'arrays', 'strings', 'sliding-window', 'prefix-sum',
  'hashing', 'trees', 'graphs', 'dp', 'sorting',
  'backtracking', 'binary-search', 'heaps', 'tries'
]

export default function DashboardPage() {
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()
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
      setSyncing(true)
      const sub = await getSubscriptionStatus(token)
      setSubscription(sub)

      if (sub.can_sync) {
        const { notes: cloudNotes, error } = await loadNotes(token)
        
        if (!error && cloudNotes) {
          setNotes(cloudNotes)
        }
      } else {
        setShowSubscriptionModal(true)
      }
    } catch (e) {
      console.error('Failed to load data:', e)
    }
    setSyncing(false)
    setLoading(false)
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

    if (editingNote) {
      const updatedNote: Note = {
        ...editingNote,
        text,
        note: noteText,
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
        text,
        note: noteText,
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
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
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
    </div>
  )
}
