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

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (note) =>
          note.text.toLowerCase().includes(query) ||
          note.note?.toLowerCase().includes(query) ||
          note.tag.toLowerCase().includes(query)
      )
    }

    // Filter by tags
    if (activeTags.length > 0) {
      result = result.filter((note) => activeTags.includes(note.tag))
    }

    // Sort: pinned first, then by id (newest first)
    result.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      return Number(b.id) - Number(a.id)
    })

    return result
  }, [notes, searchQuery, activeTags])

  if (filteredNotes.length === 0) {
    if (notes.length === 0) {
      return (
        <div className="text-center py-10 text-secondary">
          No notes yet. Start by adding one above.
        </div>
      )
    }
    return (
      <div className="text-center py-10 text-secondary">
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
