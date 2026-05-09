'use client'

import { useState, useEffect } from 'react'
import type { Note } from '@/lib/types'
import { Pin, Copy, Trash2, X, Check } from 'lucide-react'

interface NoteDetailProps {
  note: Note
  onUpdate: (updated: Note) => void
  onDelete: (id: string) => void
  onTogglePin: (id: string) => void
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

export default function NoteDetail({ note, onUpdate, onDelete, onTogglePin }: NoteDetailProps) {
  const [title, setTitle] = useState(note.title)
  const [content, setContent] = useState(note.content || '')
  const [tags, setTags] = useState<string[]>(note.tags || [])
  const [copied, setCopied] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setTitle(note.title)
    setContent(note.content || '')
    setTags(note.tags || [])
  }, [note])

  const extractTags = (input: string): string[] => {
    const matches = input.match(/#(\w+)/g)
    return matches ? matches.map((t) => t.slice(1).toLowerCase()) : []
  }

  const save = () => {
    const currentTags = extractTags(title)
    const allTags = [...new Set([...tags.filter(t => !currentTags.includes(t)), ...currentTags])]
    
    onUpdate({
      ...note,
      title: title.replace(/#\w+/g, '').trim() || 'Untitled',
      content: content,
      tags: allTags,
      updated_at: new Date().toISOString(),
    })
    
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      save()
    }
  }

  const handleCopy = () => {
    const text = content ? `${title}\n\n${content}` : title
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDelete = () => {
    if (confirm('Delete this note?')) {
      onDelete(note.id)
    }
  }

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag))
  }

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: 'var(--bg)' }}>
      <div className="p-3 flex items-center justify-between shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onTogglePin(note.id)}
            className="p-2 rounded transition-colors"
            style={{ color: note.pinned ? 'var(--accent)' : 'var(--text-secondary)' }}
            title={note.pinned ? 'Unpin' : 'Pin'}
          >
            <Pin size={16} fill={note.pinned ? 'currentColor' : 'none'} />
          </button>
          <button
            onClick={handleCopy}
            className="p-2 rounded transition-colors"
            style={{ color: copied ? '#22c55e' : 'var(--text-secondary)' }}
            title="Copy"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
          <button
            onClick={handleDelete}
            className="p-2 rounded transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="text-xs flex items-center gap-1" style={{ color: '#22c55e' }}>
              <Check size={12} />
              Saved
            </span>
          )}
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            {new Date(note.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note title... use #tag for tags"
            className="w-full text-2xl font-bold outline-none mb-4 py-2"
            style={{ backgroundColor: 'transparent', color: 'var(--text-primary)' }}
          />

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{
                    backgroundColor: getTagColor(tag),
                    color: getTagTextColor(tag),
                  }}
                >
                  #{tag}
                  <button onClick={() => removeTag(tag)} className="hover:opacity-70 ml-0.5">
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Start typing..."
            className="w-full text-base outline-none resize-none min-h-[400px] py-2"
            style={{ backgroundColor: 'transparent', color: 'var(--text-primary)' }}
          />
        </div>
      </div>
    </div>
  )
}