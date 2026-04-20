'use client'

import { useState, useEffect, useMemo } from 'react'
import type { Note } from '@/lib/types'
import { X } from 'lucide-react'

interface NoteFormProps {
  note?: Note
  onSave: (title: string, content: string, tags: string[]) => void
  onCancel?: () => void
}

export default function NoteForm({ note, onSave, onCancel }: NoteFormProps) {
  const [title, setTitle] = useState(note?.title || '')
  const [content, setContent] = useState(note?.content || '')
  const [removedTags, setRemovedTags] = useState<string[]>([])
  
  // Get existing tags from note being edited
  const existingTags = note?.tags || []

  useEffect(() => {
    if (note) {
      setTitle(note.title)
      setContent(note.content)
      setRemovedTags([])
    }
  }, [note])

  const extractTags = (input: string): string[] => {
    const matches = input.match(/#(\w+)/g)
    return matches ? matches.map((t) => t.slice(1).toLowerCase()) : []
  }

  const cleanText = (input: string): string => {
    return input.replace(/#\w+/g, '').trim()
  }

  const currentTags = useMemo(() => extractTags(title), [title])
  
  // Combine existing tags (minus removed) with newly typed tags for display
  const allTags = useMemo(() => {
    const keptExisting = existingTags.filter(t => !removedTags.includes(t))
    const newTags = currentTags.filter(t => !keptExisting.includes(t))
    // Deduplicate
    const combined = [...keptExisting, ...newTags]
    return [...new Set(combined)]
  }, [existingTags, removedTags, currentTags])

  const removeTag = (tagToRemove: string) => {
    if (existingTags.includes(tagToRemove) && !removedTags.includes(tagToRemove)) {
      setRemovedTags([...removedTags, tagToRemove])
    } else {
      const regex = new RegExp(`#${tagToRemove}\\b`, 'gi')
      setTitle(title.replace(regex, '').trim())
    }
  }

  const handleSave = () => {
    if (!title.trim()) return
    
    const tags = extractTags(title)
    // Combine: kept existing tags + new tags from text
    const keptExisting = existingTags.filter(t => !removedTags.includes(t))
    const finalTags = [...new Set([...keptExisting, ...tags])]
    const cleanedTitle = cleanText(title)
    
    onSave(cleanedTitle, content.trim(), finalTags)
    
    if (!note) {
      setTitle('')
      setContent('')
    }
  }

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
    <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
      <textarea
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Write your note... use #hashtag to add tags"
        className="w-full px-3.5 py-3 text-base rounded-md outline-none transition-all mb-3 min-h-[80px] resize-none"
        style={{ backgroundColor: 'var(--surface-alt)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
        rows={3}
      />

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Extra context (optional)..."
        className="w-full px-3.5 py-3 text-base rounded-md outline-none transition-all mb-3 resize-none"
        style={{ backgroundColor: 'var(--surface-alt)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
        rows={2}
      />

      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3 p-2 rounded" style={{ backgroundColor: 'var(--surface-alt)' }}>
          {allTags.map((tag) => (
            <span 
              key={tag}
              className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full"
              style={{ 
                backgroundColor: getTagColor(tag),
                color: getTagTextColor(tag),
              }}
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="hover:opacity-70"
              >
                <X size={12} strokeWidth={2} />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={!title.trim()}
          className="px-6 py-2.5 rounded-md font-semibold cursor-pointer transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: 'var(--accent-btn)', color: 'var(--bg)' }}
        >
          Save
        </button>
        {onCancel && (
          <button 
            onClick={onCancel} 
            className="px-6 py-2.5 rounded-md font-normal cursor-pointer transition-all"
            style={{ backgroundColor: 'var(--surface-alt)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  )
}