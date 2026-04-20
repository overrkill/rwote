'use client'

import { Search, X } from 'lucide-react'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export default function SearchBar({ value, onChange, placeholder = 'Search notes...' }: SearchBarProps) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }}>
        <Search size={18} strokeWidth={2} />
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-10 py-2.5 text-base rounded-xl outline-none transition-all"
        style={{ 
          backgroundColor: 'var(--surface-alt)',
          border: '1px solid var(--border)',
          color: 'var(--text-primary)'
        }}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded transition-all"
          style={{ color: 'var(--text-tertiary)' }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--surface-alt)'
            ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)'
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'none'
            ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text-tertiary)'
          }}
        >
          <X size={16} strokeWidth={2} />
        </button>
      )}
    </div>
  )
}
