'use client'

import { useState } from 'react'
import type { Note } from '@/lib/types'

interface NoteCardProps {
  note: Note
  onEdit?: (note: Note) => void
  onDelete?: (id: string) => void
  onTogglePin?: (id: string) => void
  onCopy?: (note: Note) => void
}

export default function NoteCard({ note, onEdit, onDelete, onTogglePin, onCopy }: NoteCardProps) {
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null)
  
  const getTagColor = (tag: string): string => {
    let hash = 0
    for (let i = 0; i < tag.length; i++) {
      hash = tag.charCodeAt(i) + ((hash << 5) - hash)
    }
    const hue = Math.abs(hash) % 360
    return `hsl(${hue}, 70%, 85%)`
  }

  const getTagTextColor = (tag: string): string => {
    let hash = 0
    for (let i = 0; i < tag.length; i++) {
      hash = tag.charCodeAt(i) + ((hash << 5) - hash)
    }
    const hue = Math.abs(hash) % 360
    return `hsl(${hue}, 70%, 25%)`
  }

  const tags = note.tag.split(',').filter(t => t.length > 0)
  
  const handleCopy = () => {
    const cleanText = note.text.replace(/#\w+/g, '').trim()
    const textToCopy = note.note ? `${cleanText}\n\n${note.note}` : cleanText
    navigator.clipboard.writeText(textToCopy)
  }

  const btnBase: React.CSSProperties = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--text-tertiary)',
    padding: '4px 6px',
    borderRadius: '4px',
    lineHeight: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.12s',
  }

  return (
    <div 
      className="rounded-lg p-3.5 flex gap-3 items-start transition-all"
      style={{ 
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        boxShadow: note.pinned ? 'var(--shadow-md)' : 'var(--shadow-sm)',
        borderColor: note.pinned ? 'var(--accent)' : 'var(--border)',
      }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap gap-1.5 mb-2">
          {tags.map((tag) => (
            <span 
              key={tag}
              className="text-xs font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide"
              style={{ 
                backgroundColor: getTagColor(tag),
                color: getTagTextColor(tag),
              }}
            >
              {tag}
            </span>
          ))}
        </div>
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
          onMouseEnter={() => setHoveredBtn('pin')}
          onMouseLeave={() => setHoveredBtn(null)}
          style={{
            ...btnBase,
            background: hoveredBtn === 'pin' ? 'var(--surface-alt)' : 'none',
            color: note.pinned ? 'var(--accent)' : (hoveredBtn === 'pin' ? 'var(--text-primary)' : 'var(--text-tertiary)'),
          }}
          title={note.pinned ? 'Unpin' : 'Pin'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill={note.pinned ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
          </svg>
        </button>
        <button
          onClick={() => {
            handleCopy()
            onCopy?.(note)
          }}
          onMouseEnter={() => setHoveredBtn('copy')}
          onMouseLeave={() => setHoveredBtn(null)}
          style={{
            ...btnBase,
            background: hoveredBtn === 'copy' ? 'var(--surface-alt)' : 'none',
            color: hoveredBtn === 'copy' ? 'var(--text-primary)' : 'var(--text-tertiary)',
          }}
          title="Copy"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
        </button>
        <button
          onClick={() => onEdit?.(note)}
          onMouseEnter={() => setHoveredBtn('edit')}
          onMouseLeave={() => setHoveredBtn(null)}
          style={{
            ...btnBase,
            background: hoveredBtn === 'edit' ? 'var(--surface-alt)' : 'none',
            color: hoveredBtn === 'edit' ? 'var(--text-primary)' : 'var(--text-tertiary)',
          }}
          title="Edit"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button
          onClick={() => onDelete?.(note.id)}
          onMouseEnter={() => setHoveredBtn('delete')}
          onMouseLeave={() => setHoveredBtn(null)}
          style={{
            ...btnBase,
            background: hoveredBtn === 'delete' ? 'var(--surface-alt)' : 'none',
            color: hoveredBtn === 'delete' ? 'var(--text-primary)' : 'var(--text-tertiary)',
          }}
          title="Delete"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
