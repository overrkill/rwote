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
    <div className={`bg-white dark:bg-[#1a1a19] border border-[#d8d8d8] dark:border-[#3a3a38] rounded-lg p-3.5 flex gap-3 items-start shadow-sm transition-all hover:shadow-md hover:border-[#a0a0a0] dark:hover:border-[#5a5a58] ${note.pinned ? 'border-l-4 border-l-[#1a1a1a] dark:border-l-[#f5f2ec]' : ''}`}>
      <div className="flex-1 min-w-0">
        <span className={`tag-${note.tag} text-xs font-semibold px-2.5 py-0.5 rounded-xl uppercase tracking-wide inline-block mb-2`}>
          {note.tag}
        </span>
        <p className="text-[#1a1a1a] dark:text-[#f5f2ec] leading-relaxed whitespace-pre-wrap">
          {note.text}
        </p>
        {note.note && (
          <p className="text-sm text-[#555555] dark:text-[#a0a0a0] mt-2">
            {note.note}
          </p>
        )}
        <p className="text-xs text-[#888888] dark:text-[#6a6a68] mt-2">{note.date}</p>
      </div>
      <div className="flex gap-1 shrink-0">
        <button
          onClick={() => onTogglePin?.(note.id)}
          className="p-1.5 text-sm hover:bg-[#f0f0f0] dark:hover:bg-[#2a2a28] rounded transition-colors"
          title={note.pinned ? 'Unpin' : 'Pin'}
        >
          {note.pinned ? '📌' : '📍'}
        </button>
        <button
          onClick={() => {
            handleCopy()
            onCopy?.(note)
          }}
          className="p-1.5 text-sm hover:bg-[#f0f0f0] dark:hover:bg-[#2a2a28] rounded transition-colors"
          title="Copy"
        >
          📋
        </button>
        <button
          onClick={() => onEdit?.(note)}
          className="p-1.5 text-sm hover:bg-[#f0f0f0] dark:hover:bg-[#2a2a28] rounded transition-colors"
          title="Edit"
        >
          ✏️
        </button>
        <button
          onClick={() => onDelete?.(note.id)}
          className="p-1.5 text-sm hover:bg-[#f0f0f0] dark:hover:bg-[#2a2a28] rounded transition-colors"
          title="Delete"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
