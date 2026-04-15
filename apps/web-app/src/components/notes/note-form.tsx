'use client'

import { useState, useEffect } from 'react'
import type { Note } from '@/lib/types'

const DEFAULT_TAGS = [
  'uncategorized', 'general', 'arrays', 'strings', 'sliding-window', 'prefix-sum',
  'hashing', 'trees', 'graphs', 'dp', 'sorting',
  'backtracking', 'binary-search', 'heaps', 'tries'
]

interface NoteFormProps {
  note?: Note
  onSave: (text: string, note: string, tag: string) => void
  onCancel?: () => void
}

export default function NoteForm({ note, onSave, onCancel }: NoteFormProps) {
  const [text, setText] = useState(note?.text || '')
  const [extraNote, setExtraNote] = useState(note?.note || '')
  const [tag, setTag] = useState(note?.tag || 'uncategorized')
  const [showTagPicker, setShowTagPicker] = useState(false)
  const [filteredTags, setFilteredTags] = useState(DEFAULT_TAGS)

  useEffect(() => {
    if (note) {
      setText(note.text)
      setExtraNote(note.note)
      setTag(note.tag)
    }
  }, [note])

  const extractTags = (input: string): string[] => {
    const matches = input.match(/#(\w+)/g)
    return matches ? matches.map((t) => t.slice(1).toLowerCase()) : []
  }

  const handleTextChange = (value: string) => {
    setText(value)
    const tags = extractTags(value)
    if (tags.length > 0 && DEFAULT_TAGS.includes(tags[0])) {
      setTag(tags[0])
    }
  }

  const handleTagSearch = (query: string) => {
    if (!query) {
      setFilteredTags(DEFAULT_TAGS)
    } else {
      setFilteredTags(DEFAULT_TAGS.filter((t) => t.includes(query.toLowerCase())))
    }
  }

  const handleSave = () => {
    if (!text.trim()) return
    onSave(text.trim(), extraNote.trim(), tag)
    if (!note) {
      setText('')
      setExtraNote('')
      setTag('uncategorized')
    }
  }

  return (
    <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
      <textarea
        value={text}
        onChange={(e) => handleTextChange(e.target.value)}
        placeholder="Write your note... use #tag for tags"
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

      <div className="flex items-center gap-3 mb-3">
        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Tag:</span>
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowTagPicker(!showTagPicker)}
            className={`tag-${tag} text-xs font-semibold px-2.5 py-1 rounded-xl uppercase tracking-wide`}
          >
            {tag}
          </button>
          {showTagPicker && (
            <div className="absolute top-full left-0 mt-1 rounded-lg shadow-lg z-10 min-w-[150px]" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="p-2" style={{ borderBottom: '1px solid var(--border)' }}>
                <input
                  type="text"
                  placeholder="Search tags..."
                  className="w-full px-2 py-1 text-sm rounded"
                  style={{ backgroundColor: 'var(--surface-alt)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  onChange={(e) => handleTagSearch(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="max-h-48 overflow-y-auto">
                {filteredTags.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setTag(t)
                      setShowTagPicker(false)
                    }}
                    className="block w-full text-left px-3 py-2 text-sm"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

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
