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
    <div 
      className="rounded-lg p-3.5 flex gap-3 items-start transition-all"
      style={{ 
        backgroundColor: 'var(--surface)',
        border: note.pinned ? '1px solid var(--accent)' : '1px solid var(--border)',
        borderLeft: note.pinned ? '4px solid var(--accent-btn)' : '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)'
      }}
    >
      <div className="flex-1 min-w-0">
        <span className={`tag-${note.tag} text-xs font-semibold px-2.5 py-0.5 rounded-xl uppercase tracking-wide inline-block mb-2`}>
          {note.tag}
        </span>
        <p className="leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-primary)' }}>
          {note.text}
        </p>
        {note.note && (
          <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
            {note.note}
          </p>
        )}
        <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>{note.date}</p>
      </div>
      <div className="flex gap-1 shrink-0">
        <button
          onClick={() => onTogglePin?.(note.id)}
          className="p-1.5 text-sm rounded transition-colors"
          style={{ color: 'var(--text-secondary)' }}
          title={note.pinned ? 'Unpin' : 'Pin'}
        >
          {note.pinned ? '📌' : '📍'}
        </button>
        <button
          onClick={() => {
            handleCopy()
            onCopy?.(note)
          }}
          className="p-1.5 text-sm rounded transition-colors"
          style={{ color: 'var(--text-secondary)' }}
          title="Copy"
        >
          📋
        </button>
        <button
          onClick={() => onEdit?.(note)}
          className="p-1.5 text-sm rounded transition-colors"
          style={{ color: 'var(--text-secondary)' }}
          title="Edit"
        >
          ✏️
        </button>
        <button
          onClick={() => onDelete?.(note.id)}
          className="p-1.5 text-sm rounded transition-colors"
          style={{ color: 'var(--text-secondary)' }}
          title="Delete"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
