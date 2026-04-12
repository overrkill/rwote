'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  getLocalAuth, 
  signOut,
  clearLocalAuth,
  loadNotes,
  saveNote,
  deleteNote as cloudDeleteNote,
  getSubscriptionStatus,
  subscribeToPlan
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
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null)
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)

  useEffect(() => {
    const auth = getLocalAuth()
    if (!auth) {
      router.push('/auth/login')
      return
    }

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

    loadData(auth.token)
  }, [router])

  const syncToCloud = async (note: Note) => {
    if (!subscription?.can_sync) return
    const auth = getLocalAuth()
    if (!auth) return

    try {
      await saveNote(note, auth.token)
    } catch (e) {
      console.error('Failed to sync note:', e)
    }
  }

  const deleteFromCloud = async (id: string) => {
    if (!subscription?.can_sync) return
    const auth = getLocalAuth()
    if (!auth) return

    try {
      await cloudDeleteNote(id, auth.token)
    } catch (e) {
      console.error('Failed to delete from cloud:', e)
    }
  }

  const handleSaveNote = (text: string, noteText: string, tag: string) => {
    const auth = getLocalAuth()
    if (!auth || !subscription?.can_sync) {
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
    const auth = getLocalAuth()
    if (!auth) return

    try {
      await subscribeToPlan(plan, auth.token)
      const sub = await getSubscriptionStatus(auth.token)
      setSubscription(sub)
      
      if (sub.can_sync) {
        setShowSubscriptionModal(false)
        setSyncing(true)
        const { notes: cloudNotes, error } = await loadNotes(auth.token)
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
    const auth = getLocalAuth()
    if (auth?.token) {
      await signOut()
    }
    clearLocalAuth()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-secondary">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-surface border-b border-border px-4 py-3 sticky top-0 z-30">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold">Rwote</h1>
            {syncing && (
              <span className="text-xs text-tertiary animate-pulse">Syncing...</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm px-3 py-1.5 rounded-lg border bg-primary text-white border-primary">
              ☁️ Synced
            </div>
            <button
              onClick={handleSignOut}
              className="btn-secondary text-sm py-1.5"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

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
            className="w-full mb-6 py-3 text-center border-2 border-dashed border-border rounded-lg text-secondary hover:border-border-focus hover:text-primary transition-colors"
          >
            + Add Note
          </button>
        )}

        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-secondary">
            {notes.length} {notes.length === 1 ? 'note' : 'notes'}
            {subscription?.can_sync && (
              <span className="ml-2 text-tertiary">• Synced</span>
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
