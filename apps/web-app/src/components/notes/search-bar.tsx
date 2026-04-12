'use client'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export default function SearchBar({ value, onChange, placeholder = 'Search notes...' }: SearchBarProps) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
        🔍
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-10 py-2.5 text-base bg-[#f0f0f0] dark:bg-[#2a2a28] border border-[#d8d8d8] dark:border-[#3a3a38] rounded-xl text-[#1a1a1a] dark:text-[#f5f2ec] placeholder-gray-400 dark:placeholder-gray-500 outline-none transition-all focus:border-[#a0a0a0] dark:focus:border-[#5a5a58] focus:ring-2 focus:ring-[#a0a0a0]/20 dark:focus:ring-[#5a5a58]/20"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
        >
          ×
        </button>
      )}
    </div>
  )
}
