'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { X } from 'lucide-react'
import type { Note } from '@/lib/types'

interface NotepadDrawerProps {
  note?: Note | null
  onSave: (title: string, content: string, tags: string[]) => void
  onClose: () => void
  isOpen: boolean
}

export default function NotepadDrawer({ note, onSave, onClose, isOpen }: NotepadDrawerProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [removedTags, setRemovedTags] = useState<string[]>([])

  const existingTags = note?.tags || []

  useEffect(() => {
    if (note) {
      setTitle(note.title)
      setContent(note.content)
      setRemovedTags([])
    } else {
      setTitle('')
      setContent('')
      setRemovedTags([])
    }
  }, [note, isOpen])

  const extractTags = (input: string): string[] => {
    const matches = input.match(/#(\w+)/g)
    return matches ? matches.map((t) => t.slice(1).toLowerCase()) : []
  }

  const cleanText = (input: string): string => {
    return input.replace(/#\w+/g, '').trim()
  }

  const currentTags = useMemo(() => extractTags(title), [title])

  const allTags = useMemo(() => {
    const keptExisting = existingTags.filter(t => !removedTags.includes(t))
    const newTags = currentTags.filter(t => !keptExisting.includes(t))
    return [...new Set([...keptExisting, ...newTags])]
  }, [existingTags, removedTags, currentTags])

  const removeTag = (tagToRemove: string) => {
    if (existingTags.includes(tagToRemove) && !removedTags.includes(tagToRemove)) {
      setRemovedTags([...removedTags, tagToRemove])
    } else {
      const regex = new RegExp(`#${tagToRemove}\\b`, 'gi')
      setTitle(title.replace(regex, '').trim())
    }
  }

  const handleSave = useCallback(() => {
    if (!title.trim()) return

    const tags = extractTags(title)
    const keptExisting = existingTags.filter(t => !removedTags.includes(t))
    const finalTags = [...new Set([...keptExisting, ...tags])]
    const cleanedTitle = cleanText(title)

    onSave(cleanedTitle, content.trim(), finalTags)
    onClose()
  }, [title, content, existingTags, removedTags, onSave, onClose])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        handleSave()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, handleSave])

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

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 animate-fade-in"
          onClick={onClose}
          style={{ backdropFilter: 'blur(2px)' }}
        />
      )}

      <div
        className={`fixed top-0 right-0 h-full w-full max-w-xl z-50 flex flex-col transition-transform duration-300 ease-out shadow-2xl ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ backgroundColor: 'var(--surface)', borderLeft: '1px solid var(--border)' }}
      >
        <div className="p-4 flex items-center justify-between shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
          <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>
            {note ? 'Edit Note' : 'New Note'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-md transition-colors hover:bg-black/10"
            style={{ color: 'var(--text-secondary)' }}
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note title... use #tag for tags"
            className="w-full px-4 py-3 text-lg font-medium rounded-lg outline-none transition-all mb-3"
            style={{ backgroundColor: 'var(--surface-alt)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            autoFocus
          />

          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--surface-alt)' }}>
              {allTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{
                    backgroundColor: getTagColor(tag),
                    color: getTagTextColor(tag),
                  }}
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="hover:opacity-70 transition-opacity"
                  >
                    <X size={12} strokeWidth={2.5} />
                  </button>
                </span>
              ))}
            </div>
          )}

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Additional notes... (optional)"
            className="flex-1 w-full px-4 py-3 text-base rounded-lg outline-none transition-all resize-none min-h-[200px]"
            style={{ backgroundColor: 'var(--surface-alt)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          />

          <div className="mt-4 text-xs" style={{ color: 'var(--text-tertiary)' }}>
            <span className="font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--surface-alt)' }}>⌘ + Enter</span> to save
          </div>
        </div>

        <div className="p-4 shrink-0 flex gap-3" style={{ borderTop: '1px solid var(--border)' }}>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-md font-normal cursor-pointer transition-all"
            style={{ backgroundColor: 'var(--surface-alt)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim()}
            className="flex-1 px-5 py-2.5 rounded-md font-semibold cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: 'var(--accent-btn)', color: 'var(--bg)' }}
          >
            Save
          </button>
        </div>
      </div>
    </>
  )
}