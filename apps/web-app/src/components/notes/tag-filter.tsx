'use client'

import { useState } from 'react'
import { Filter } from 'lucide-react'

interface TagFilterProps {
  tags: string[]
  activeTags: string[]
  onChange: (tags: string[]) => void
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

export default function TagFilter({ tags, activeTags, onChange }: TagFilterProps) {
  const [showDropdown, setShowDropdown] = useState(false)

  const toggleTag = (tag: string) => {
    if (activeTags.includes(tag)) {
      onChange(activeTags.filter((t) => t !== tag))
    } else {
      onChange([...activeTags, tag])
    }
  }

  const clearAll = () => {
    onChange([])
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors"
        style={{ 
          backgroundColor: activeTags.length > 0 ? 'var(--accent-btn)' : 'var(--surface-alt)',
          color: activeTags.length > 0 ? 'var(--bg)' : 'var(--text-secondary)',
          borderColor: activeTags.length > 0 ? 'var(--accent-btn)' : 'var(--border)'
        }}
      >
        <Filter size={18} strokeWidth={2} />
        <span>{activeTags.length > 0 ? `${activeTags.length} selected` : 'Filter'}</span>
      </button>

      {showDropdown && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute top-full left-0 mt-1 rounded-lg shadow-lg z-20 min-w-[200px]" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="p-2 flex justify-between items-center" style={{ borderBottom: '1px solid var(--border)' }}>
              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Select tags</span>
              {activeTags.length > 0 && (
                <button
                  onClick={clearAll}
                  className="text-xs"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Clear all
                </button>
              )}
            </div>
            <div className="max-h-64 overflow-y-auto p-2">
              {tags.length === 0 ? (
                <p className="text-sm p-2" style={{ color: 'var(--text-secondary)' }}>
                  No tags yet. Add #hashtags to your notes!
                </p>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {tags.map((tag) => {
                    const isActive = activeTags.includes(tag)
                    return (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className="text-[13px] px-2 py-1 rounded-lg border transition-colors"
                        style={{ 
                          backgroundColor: isActive ? getTagColor(tag) : 'transparent',
                          color: isActive ? getTagTextColor(tag) : 'var(--text-primary)',
                          borderColor: isActive ? getTagColor(tag) : 'var(--border)'
                        }}
                      >
                        #{tag}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
