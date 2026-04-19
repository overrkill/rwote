'use client'

import { useMemo } from 'react'
import type { Note } from '@/lib/types'
import NoteCard from './note-card'

interface NoteListProps {
  notes: Note[]
  searchQuery?: string
  activeTags?: string[]
  onEdit?: (note: Note) => void
  onDelete?: (id: string) => void
  onTogglePin?: (id: string) => void
  onCopy?: (note: Note) => void
}

export default function NoteList({
  notes,
  searchQuery = '',
  activeTags = [],
  onEdit,
  onDelete,
  onTogglePin,
  onCopy,
}: NoteListProps) {
  const filteredNotes = useMemo(() => {
    let result = [...notes]

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (note) =>
          note.title.toLowerCase().includes(query) ||
          note.content?.toLowerCase().includes(query) ||
          note.tags?.some(t => t.toLowerCase().includes(query))
      )
    }

    if (activeTags.length > 0) {
      result = result.filter((noteItem) => {
        const noteTags = noteItem.tags || []
        return activeTags.some((at) => noteTags.includes(at))
      })
    }

    result.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    })

    return result
  }, [notes, searchQuery, activeTags])

  if (filteredNotes.length === 0) {
    if (notes.length === 0) {
      return (
        <div className="text-center py-10" style={{ color: 'var(--text-secondary)' }}>
          No notes yet. Start by adding one above.
        </div>
      )
    }
    return (
      <div className="text-center py-10" style={{ color: 'var(--text-secondary)' }}>
        No notes match your search.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {filteredNotes.map((note) => (
        <NoteCard
          key={note.id}
          note={note}
          onEdit={onEdit}
          onDelete={onDelete}
          onTogglePin={onTogglePin}
          onCopy={onCopy}
        />
      ))}
    </div>
  )
}
