'use client'

import { useState, useEffect } from 'react'

interface TagFilterProps {
  tags: string[]
  activeTags: string[]
  onChange: (tags: string[]) => void
}

const TAG_LABELS: Record<string, string> = {
  uncategorized: 'Uncategorized',
  general: 'General',
  arrays: 'Arrays',
  strings: 'Strings',
  'sliding-window': 'Sliding Window',
  'prefix-sum': 'Prefix Sum',
  hashing: 'Hashing',
  trees: 'Trees',
  graphs: 'Graphs',
  dp: 'DP',
  sorting: 'Sorting',
  backtracking: 'Backtracking',
  'binary-search': 'Binary Search',
  heaps: 'Heaps',
  tries: 'Tries',
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
        className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors ${
          activeTags.length > 0
            ? 'bg-primary text-white border-primary'
            : 'bg-surface-alt text-secondary border-border hover:border-border-focus'
        }`}
      >
        <span>🏷️</span>
        <span>{activeTags.length > 0 ? `${activeTags.length} selected` : 'Filter'}</span>
      </button>

      {showDropdown && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute top-full left-0 mt-1 bg-white border border-border rounded-lg shadow-md z-20 min-w-[200px]">
            <div className="p-2 border-b border-border flex justify-between items-center">
              <span className="text-sm font-medium">Select tags</span>
              {activeTags.length > 0 && (
                <button
                  onClick={clearAll}
                  className="text-xs text-secondary hover:text-primary"
                >
                  Clear all
                </button>
              )}
            </div>
            <div className="max-h-64 overflow-y-auto p-2">
              <div className="flex flex-wrap gap-1">
                {tags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                      activeTags.includes(tag)
                        ? 'bg-primary text-white border-primary'
                        : 'bg-surface-alt text-secondary border-border hover:border-border-focus'
                    }`}
                  >
                    {TAG_LABELS[tag] || tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
