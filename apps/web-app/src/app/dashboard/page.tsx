'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  getLocalAuth, 
  signOut, 
  clearLocalAuth, 
  getLocalNotes, 
  setLocalNotes,
  getLocalMode,
  setLocalMode,
  loadNotes,
  saveNote,
  deleteNote as cloudDeleteNote,
  getSubscriptionStatus,
  subscribeToPlan,
  mergeNotes
} from '@/lib/supabase'
import type { Note, SubscriptionStatus } from '@/lib/types'
import { NoteList, NoteForm } from '@/components/notes'
import SearchBar from '@/components/notes/search-bar'
import TagFilter from '@/components/notes/tag-filter'
import SubscriptionModal from '@/components/ui/subscription-modal'

const DEFAULT_TAGS = [
  'uncategorized', 'general', 'arrays', 'strings', 'sliding-window', 'prefix-sum',
  'hashing', 'trees', 'graphs', 'dp', 'sorting',
  'backtracking', 'binary-search', 'heaps', 'tries'
]

export default function DashboardPage() {
  const router = useRouter()
  const [notes, setNotes] = useState<Note[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTags, setActiveTags] = useState<string[]>([])
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [mode, setMode] = useState<'local' | 'cloud'>('local')
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null)
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)

  // Load notes and subscription status
  useEffect(() => {
    const auth = getLocalAuth()
    if (!auth) {
      router.push('/auth/login')
      return
    }

    const authToken = auth.token
    const localMode = getLocalMode() as 'local' | 'cloud'
    
    // Only set cloud mode if subscribed
    if (localMode === 'cloud') {
      setMode('cloud')
    }

    const localNotes = getLocalNotes()
    setNotes(localNotes)

    // Load subscription status and cloud notes if in cloud mode
    async function loadData() {
      try {
        const sub = await getSubscriptionStatus(authToken)
        setSubscription(sub)

        // If cloud mode but not subscribed, revert to local
        if (localMode === 'cloud' && !sub.can_sync) {
          setMode('local')
          setLocalMode('local')
        } else if (localMode === 'cloud' && sub.can_sync) {
          setSyncing(true)
          const { notes: cloudNotes, error } = await loadNotes(authToken)
          
          if (!error && cloudNotes) {
            const merged = mergeNotes(localNotes, cloudNotes)
            setNotes(merged)
            setLocalNotes(merged)
          }
          setSyncing(false)
        }
      } catch (e) {
        console.error('Failed to load data:', e)
      }
      setLoading(false)
    }

    loadData()
  }, [router])

  // Sync note to cloud
  const syncToCloud = async (note: Note) => {
    if (mode !== 'cloud' || !subscription?.can_sync) return
    const auth = getLocalAuth()
    if (!auth) return

    try {
      await saveNote(note, auth.token)
    } catch (e) {
      console.error('Failed to sync note:', e)
    }
  }

  // Delete note from cloud
  const deleteFromCloud = async (id: string) => {
    if (mode !== 'cloud' || !subscription?.can_sync) return
    const auth = getLocalAuth()
    if (!auth) return

    try {
      await cloudDeleteNote(id, auth.token)
    } catch (e) {
      console.error('Failed to delete from cloud:', e)
    }
  }

  const handleSaveNote = (text: string, noteText: string, tag: string) => {
    if (editingNote) {
      const updatedNotes = notes.map((n) =>
        n.id === editingNote.id
          ? { ...n, text, note: noteText, tag, updated_at: Date.now() }
          : n
      )
      setNotes(updatedNotes)
      setLocalNotes(updatedNotes)
      syncToCloud(updatedNotes.find(n => n.id === editingNote.id)!)
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
      const updatedNotes = [newNote, ...notes]
      setNotes(updatedNotes)
      setLocalNotes(updatedNotes)
      syncToCloud(newNote)
    }
    setShowForm(false)
  }

  const handleDelete = (id: string) => {
    const updatedNotes = notes.filter((n) => n.id !== id)
    setNotes(updatedNotes)
    setLocalNotes(updatedNotes)
    deleteFromCloud(id)
  }

  const handleTogglePin = (id: string) => {
    const updatedNotes = notes.map((n) =>
      n.id === id ? { ...n, pinned: !n.pinned, updated_at: Date.now() } : n
    )
    setNotes(updatedNotes)
    setLocalNotes(updatedNotes)
    syncToCloud(updatedNotes.find(n => n.id === id)!)
  }

  const handleToggleMode = async () => {
    if (mode === 'local') {
      // Trying to enable cloud mode - check subscription first
      if (!subscription?.can_sync) {
        setShowSubscriptionModal(true)
        return
      }
      
      // Enable cloud mode
      setMode('cloud')
      setLocalMode('cloud')
      
      // Load cloud notes
      const auth = getLocalAuth()
      if (auth) {
        setSyncing(true)
        const { notes: cloudNotes, error } = await loadNotes(auth.token)
        if (!error && cloudNotes) {
          const merged = mergeNotes(notes, cloudNotes)
          setNotes(merged)
          setLocalNotes(merged)
        }
        setSyncing(false)
      }
    } else {
      // Disable cloud mode
      setMode('local')
      setLocalMode('local')
    }
  }

  const handleSubscribe = async (plan: string) => {
    const auth = getLocalAuth()
    if (!auth) return

    try {
      await subscribeToPlan(plan, auth.token)
      // Refresh subscription status
      const sub = await getSubscriptionStatus(auth.token)
      setSubscription(sub)
      
      // Enable cloud mode if subscribed
      if (sub.can_sync) {
        setMode('cloud')
        setLocalMode('cloud')
        
        // Load cloud notes
        setSyncing(true)
        const { notes: cloudNotes, error } = await loadNotes(auth.token)
        if (!error && cloudNotes) {
          const merged = mergeNotes(notes, cloudNotes)
          setNotes(merged)
          setLocalNotes(merged)
        }
        setSyncing(false)
      }
    } catch (e) {
      console.error('Failed to subscribe:', e)
    }
  }

  const handleSignOut = async () => {
    const auth = getLocalAuth()
    if (auth?.token) {
      await signOut()
    }
    clearLocalAuth()
    router.push('/')
  }

  const canSync = subscription?.can_sync === true

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-secondary">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-surface border-b border-border px-4 py-3 sticky top-0 z-30">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold">Rwote</h1>
            {syncing && (
              <span className="text-xs text-tertiary animate-pulse">Syncing...</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {/* Cloud sync status button */}
            {!canSync ? (
              <button
                onClick={() => setShowSubscriptionModal(true)}
                className="text-sm px-3 py-1.5 rounded-lg border border-border bg-surface-alt text-secondary hover:border-border-focus transition-colors"
                title="Upgrade to enable cloud sync"
              >
                ⬆️ Upgrade
              </button>
            ) : (
              <div
                className={`text-sm px-3 py-1.5 rounded-lg border ${
                  mode === 'cloud'
                    ? 'bg-primary text-white border-primary'
                    : 'bg-surface-alt text-secondary border-border'
                }`}
                title={mode === 'cloud' ? 'Cloud sync enabled' : 'Local storage'}
              >
                {mode === 'cloud' ? '☁️ Cloud' : '💾 Local'}
              </div>
            )}
            <button
              onClick={handleSignOut}
              className="btn-secondary text-sm py-1.5"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Search and filter */}
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

        {/* Add note form */}
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

        {/* Add note button (when form is hidden) */}
        {!showForm && !editingNote && (
          <button
            onClick={() => setShowForm(true)}
            className="w-full mb-6 py-3 text-center border-2 border-dashed border-border rounded-lg text-secondary hover:border-border-focus hover:text-primary transition-colors"
          >
            + Add Note
          </button>
        )}

        {/* Notes count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-secondary">
            {notes.length} {notes.length === 1 ? 'note' : 'notes'}
            {mode === 'cloud' && canSync && (
              <span className="ml-2 text-tertiary">• Synced</span>
            )}
          </p>
        </div>

        {/* Notes list */}
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

      {/* Subscription Modal */}
      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        subscription={subscription}
        onSubscribe={handleSubscribe}
      />
    </div>
  )
}
