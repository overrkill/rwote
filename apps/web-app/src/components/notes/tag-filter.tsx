'use client'

import { useState } from 'react'

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
            ? 'bg-[#1a1a1a] dark:bg-[#f5f2ec] text-white dark:text-[#0f0e0d] border-[#1a1a1a] dark:border-[#f5f2ec]'
            : 'bg-[#f0f0f0] dark:bg-[#2a2a28] text-[#555555] dark:text-[#a0a0a0] border-[#d8d8d8] dark:border-[#3a3a38] hover:border-[#a0a0a0] dark:hover:border-[#5a5a58]'
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
          <div className="absolute top-full left-0 mt-1 bg-white dark:bg-[#1a1a19] border border-[#d8d8d8] dark:border-[#3a3a38] rounded-lg shadow-lg z-20 min-w-[200px]">
            <div className="p-2 border-b border-[#d8d8d8] dark:border-[#3a3a38] flex justify-between items-center">
              <span className="text-sm font-medium text-[#1a1a1a] dark:text-[#f5f2ec]">Select tags</span>
              {activeTags.length > 0 && (
                <button
                  onClick={clearAll}
                  className="text-xs text-[#555555] dark:text-[#a0a0a0] hover:text-[#1a1a1a] dark:hover:text-[#f5f2ec]"
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
                        ? 'bg-[#1a1a1a] dark:bg-[#f5f2ec] text-white dark:text-[#0f0e0d] border-[#1a1a1a] dark:border-[#f5f2ec]'
                        : 'bg-[#f0f0f0] dark:bg-[#2a2a28] text-[#555555] dark:text-[#a0a0a0] border-[#d8d8d8] dark:border-[#3a3a38] hover:border-[#a0a0a0] dark:hover:border-[#5a5a58]'
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
