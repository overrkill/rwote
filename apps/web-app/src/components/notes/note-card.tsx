'use client'

import type { Note } from '@/lib/types'

interface NoteCardProps {
  note: Note
  onEdit?: (note: Note) => void
  onDelete?: (id: string) => void
  onTogglePin?: (id: string) => void
  onCopy?: (note: Note) => void
}

export default function NoteCard({ note, onEdit, onDelete, onTogglePin, onCopy }: NoteCardProps) {
  const handleCopy = () => {
    const cleanText = note.text.replace(/#\w+/g, '').trim()
    const textToCopy = note.note ? `${cleanText}\n\n${note.note}` : cleanText
    navigator.clipboard.writeText(textToCopy)
  }

  return (
    <div className={`card ${note.pinned ? 'border-l-4 border-l-accent-btn' : ''}`}>
      <div className="flex-1 min-w-0">
        <span className={`tag-${note.tag} text-xs font-semibold px-2.5 py-0.5 rounded-xl uppercase tracking-wide inline-block mb-2`}>
          {note.tag}
        </span>
        <p className="text-primary leading-relaxed whitespace-pre-wrap">
          {note.text}
        </p>
        {note.note && (
          <p className="text-sm text-secondary mt-2">
            {note.note}
          </p>
        )}
        <p className="text-xs text-tertiary mt-2">{note.date}</p>
      </div>
      <div className="flex gap-1 shrink-0">
        <button
          onClick={() => onTogglePin?.(note.id)}
          className="p-1.5 text-sm hover:bg-surface-alt rounded transition-colors"
          title={note.pinned ? 'Unpin' : 'Pin'}
        >
          {note.pinned ? '📌' : '📍'}
        </button>
        <button
          onClick={() => {
            handleCopy()
            onCopy?.(note)
          }}
          className="p-1.5 text-sm hover:bg-surface-alt rounded transition-colors"
          title="Copy"
        >
          📋
        </button>
        <button
          onClick={() => onEdit?.(note)}
          className="p-1.5 text-sm hover:bg-surface-alt rounded transition-colors"
          title="Edit"
        >
          ✏️
        </button>
        <button
          onClick={() => onDelete?.(note.id)}
          className="p-1.5 text-sm hover:bg-surface-alt rounded transition-colors"
          title="Delete"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
