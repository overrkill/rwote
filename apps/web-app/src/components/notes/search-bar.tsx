'use client'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export default function SearchBar({ value, onChange, placeholder = 'Search notes...' }: SearchBarProps) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }}>
        🔍
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
          className="absolute right-3 top-1/2 -translate-y-1/2 hover:opacity-70"
          style={{ color: 'var(--text-tertiary)' }}
        >
          ×
        </button>
      )}
    </div>
  )
}
