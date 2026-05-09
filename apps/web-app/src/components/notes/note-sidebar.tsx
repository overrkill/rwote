'use client'

import { useState } from 'react'
import type { Note } from '@/lib/types'
import { Plus, Search, X, Hash } from 'lucide-react'

interface NoteSidebarProps {
  notes: Note[]
  selectedId: string | null
  onSelect: (note: Note) => void
  onNew: () => void
  searchQuery: string
  onSearchChange: (query: string) => void
}

function getTagColor(tag: string): string {
  let hash = 0
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = Math.abs(hash) % 360
  return `hsl(${hue}, 70%, 85%)`
}

function getTagTextColor(tag: string): string {
  let hash = 0
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = Math.abs(hash) % 360
  return `hsl(${hue}, 70%, 25%)`
}

export default function NoteSidebar({
  notes,
  selectedId,
  onSelect,
  onNew,
  searchQuery,
  onSearchChange,
}: NoteSidebarProps) {
  const filteredNotes = notes.filter(note => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      note.title.toLowerCase().includes(q) ||
      (note.content && note.content.toLowerCase().includes(q)) ||
      (note.tags && note.tags.some(t => t.toLowerCase().includes(q)))
    )
  })

  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1
    if (!a.pinned && b.pinned) return 1
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  return (
    <div
      className="h-full flex flex-col"
      style={{ 
        backgroundColor: 'var(--surface)', 
        borderRight: '1px solid var(--border)',
      }}
    >
      <style jsx>{`
        .sidebar-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .sidebar-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .sidebar-scroll::-webkit-scrollbar-thumb {
          background: var(--border);
          border-radius: 2px;
        }
        .sidebar-scroll::-webkit-scrollbar-thumb:hover {
          background: var(--text-tertiary);
        }
      `}</style>
      <div className="p-3 flex items-center gap-2 shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <button
          onClick={onNew}
          className="p-2 rounded-md transition-colors hover:bg-black/10"
          style={{ color: 'var(--text-primary)' }}
          title="New Note"
        >
          <Plus size={18} strokeWidth={2} />
        </button>
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search..."
            className="w-full h-8 pl-8 pr-3 text-sm rounded-md outline-none transition-colors"
            style={{ backgroundColor: 'var(--surface-alt)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-black/10"
              style={{ color: 'var(--text-tertiary)' }}
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto sidebar-scroll">
        {sortedNotes.length === 0 ? (
          <div className="p-4 text-sm text-center" style={{ color: 'var(--text-tertiary)' }}>
            {searchQuery ? 'No notes match' : 'No notes yet'}
          </div>
        ) : (
          sortedNotes.map((note) => {
            const firstLine = note.content?.split('\n')[0]?.slice(0, 60) || ''
            const isSelected = note.id === selectedId

            return (
              <div
                key={note.id}
                onClick={() => onSelect(note)}
                className="p-3 cursor-pointer transition-colors"
                style={{
                  backgroundColor: isSelected ? 'var(--surface-alt)' : 'transparent',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div
                      className="text-sm font-medium truncate"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {note.pinned && (
                        <span className="inline-block mr-1" style={{ color: 'var(--accent)' }}>📌</span>
                      )}
                      {note.title || 'Untitled'}
                    </div>
                    {firstLine && (
                      <div
                        className="text-xs truncate mt-0.5"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {firstLine}
                      </div>
                    )}
                  </div>
                </div>
                {note.tags && note.tags.length > 0 && (
                  <div className="flex gap-1 mt-1.5 overflow-hidden">
                    {note.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-0.5 text-[8px] px-1.5 py-0.5 rounded shrink-0"
                        style={{
                          backgroundColor: getTagColor(tag),
						  opacity:0.4,
                          color: getTagTextColor(tag),
                        }}
                      >
                        <Hash size={8} />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
