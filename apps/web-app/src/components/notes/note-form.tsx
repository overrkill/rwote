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
    <div className="bg-[#fafafa] dark:bg-[#1a1a19] rounded-lg p-4 border border-[#d8d8d8] dark:border-[#3a3a38]">
      <textarea
        value={text}
        onChange={(e) => handleTextChange(e.target.value)}
        placeholder="Write your note... use #tag for tags"
        className="w-full px-3.5 py-3 text-base bg-[#f0f0f0] dark:bg-[#2a2a28] text-[#1a1a1a] dark:text-[#f5f2ec] border border-[#d8d8d8] dark:border-[#3a3a38] rounded-md outline-none transition-all mb-3 min-h-[80px] resize-none placeholder-gray-400 dark:placeholder-gray-500"
        rows={3}
      />

      <textarea
        value={extraNote}
        onChange={(e) => setExtraNote(e.target.value)}
        placeholder="Extra context (optional)..."
        className="w-full px-3.5 py-3 text-base bg-[#f0f0f0] dark:bg-[#2a2a28] text-[#1a1a1a] dark:text-[#f5f2ec] border border-[#d8d8d8] dark:border-[#3a3a38] rounded-md outline-none transition-all mb-3 resize-none placeholder-gray-400 dark:placeholder-gray-500"
        rows={2}
      />

      <div className="flex items-center gap-3 mb-3">
        <span className="text-sm text-[#555555] dark:text-[#a0a0a0]">Tag:</span>
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowTagPicker(!showTagPicker)}
            className={`tag-${tag} text-xs font-semibold px-2.5 py-1 rounded-xl uppercase tracking-wide`}
          >
            {tag}
          </button>
          {showTagPicker && (
            <div className="absolute top-full left-0 mt-1 bg-white dark:bg-[#1a1a19] border border-[#d8d8d8] dark:border-[#3a3a38] rounded-lg shadow-lg z-10 min-w-[150px]">
              <div className="p-2 border-b border-[#d8d8d8] dark:border-[#3a3a38]">
                <input
                  type="text"
                  placeholder="Search tags..."
                  className="w-full px-2 py-1 text-sm border border-[#d8d8d8] dark:border-[#3a3a38] rounded bg-white dark:bg-[#2a2a28] text-[#1a1a1a] dark:text-[#f5f2ec]"
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
                    className={`block w-full text-left px-3 py-2 text-sm hover:bg-[#f0f0f0] dark:hover:bg-[#2a2a28] ${tag === t ? 'bg-[#f0f0f0] dark:bg-[#2a2a28] font-medium' : ''} text-[#1a1a1a] dark:text-[#f5f2ec]`}
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
          className="px-6 py-2.5 bg-[#1a1a1a] dark:bg-[#f5f2ec] text-white dark:text-[#0f0e0d] border-none rounded-md font-semibold cursor-pointer transition-opacity hover:opacity-85 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save
        </button>
        {onCancel && (
          <button onClick={onCancel} className="px-6 py-2.5 bg-[#f0f0f0] dark:bg-[#2a2a28] text-[#1a1a1a] dark:text-[#f5f2ec] border border-[#d8d8d8] dark:border-[#3a3a38] rounded-md font-normal cursor-pointer transition-all hover:border-[#a0a0a0] dark:hover:border-[#5a5a58]">
            Cancel
          </button>
        )}
      </div>
    </div>
  )
}
