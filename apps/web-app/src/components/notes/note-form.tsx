'use client'

import { useState, useEffect, useMemo } from 'react'
import type { Note } from '@/lib/types'

interface NoteFormProps {
  note?: Note
  onSave: (text: string, note: string, tag: string) => void
  onCancel?: () => void
}

export default function NoteForm({ note, onSave, onCancel }: NoteFormProps) {
  const [text, setText] = useState(note?.text || '')
  const [extraNote, setExtraNote] = useState(note?.note || '')
  const [removedTags, setRemovedTags] = useState<string[]>([])
  
  // Get existing tags from note being edited
  const existingTags = note?.tag ? note.tag.split(',').filter(t => t.length > 0) : []

  useEffect(() => {
    if (note) {
      setText(note.text)
      setExtraNote(note.note)
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

  const currentTags = useMemo(() => extractTags(text), [text])
  
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
      setText(text.replace(regex, '').trim())
    }
  }

  const handleSave = () => {
    if (!text.trim()) return
    
    const tags = extractTags(text)
    // Combine: kept existing tags + new tags from text
    const keptExisting = existingTags.filter(t => !removedTags.includes(t))
    const finalTags = [...new Set([...keptExisting, ...tags])]
    const tagString = finalTags.length > 0 ? finalTags.join(',') : 'uncategorized'
    const cleanedText = cleanText(text)
    
    onSave(cleanedText, extraNote.trim(), tagString)
    
    if (!note) {
      setText('')
      setExtraNote('')
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
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write your note... use #hashtag to add tags"
        className="w-full px-3.5 py-3 text-base rounded-md outline-none transition-all mb-3 min-h-[80px] resize-none"
        style={{ backgroundColor: 'var(--surface-alt)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
        rows={3}
      />

      <textarea
        value={extraNote}
        onChange={(e) => setExtraNote(e.target.value)}
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
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={!text.trim()}
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