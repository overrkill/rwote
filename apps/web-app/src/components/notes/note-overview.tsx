'use client'

import { useEffect, useState } from 'react'
import { loadAllNoteAnalyses } from '@/lib/supabase'
import type { NoteAnalysis } from '@/lib/types'
import { Calendar, CheckSquare, RefreshCw, BookOpen, ChevronUp, ChevronDown } from 'lucide-react'

interface AggregatedData {
  todos: { text: string }[]
  followUps: { text: string; date?: string }[]
  deadlines: { text: string; date?: string }[]
  flashCards: { front: string; back: string }[]
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

type SectionKey = 'todos' | 'followUps' | 'deadlines' | 'flashCards'

const SECTION_CONFIG: Record<SectionKey, { icon: typeof Calendar; label: string; color: string }> = {
  deadlines:  { icon: Calendar,   label: 'Deadlines',   color: '#ef4444' },
  todos:      { icon: CheckSquare, label: 'To-Dos',      color: '#3b82f6' },
  followUps:  { icon: RefreshCw,  label: 'Follow-ups',  color: '#a855f7' },
  flashCards: { icon: BookOpen,   label: 'Flash Cards', color: '#22c55e' },
}

export default function NoteOverview() {
  const [data, setData] = useState<AggregatedData | null>(null)
  const [loading, setLoading] = useState(true)
  const [openSections, setOpenSections] = useState<Set<SectionKey>>(new Set(['todos', 'followUps', 'deadlines', 'flashCards']))

  const toggleSection = (key: SectionKey) => {
    setOpenSections(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  useEffect(() => {
    async function fetchData() {
      try {
        const analyses = await loadAllNoteAnalyses()
        const aggregated: AggregatedData = {
          todos: [],
          followUps: [],
          deadlines: [],
          flashCards: [],
        }

        for (const analysis of Object.values(analyses)) {
          aggregated.todos.push(...(analysis.todos || []))
          aggregated.followUps.push(...(analysis.followUps || []))
          aggregated.deadlines.push(...(analysis.deadlines || []))
          aggregated.flashCards.push(...(analysis.flashCards || []))
        }

        aggregated.flashCards = shuffle(aggregated.flashCards).slice(0, 4)

        setData(aggregated)
      } catch (e) {
        console.error('Failed to load analyses:', e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center" style={{ color: 'var(--text-tertiary)' }}>
        <div style={{ color: 'var(--text-tertiary)' }}>Loading overview...</div>
      </div>
    )
  }

  if (!data || (!data.todos.length && !data.followUps.length && !data.deadlines.length && !data.flashCards.length)) {
    return (
      <div className="h-full flex items-center justify-center" style={{ color: 'var(--text-tertiary)' }}>
        <div className="text-center max-w-sm px-6">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'var(--surface-alt)' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
          </div>
          <h2 className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>No note selected</h2>
          <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--text-secondary)' }}>
            Pick a note from the sidebar or create a new one to get started.
          </p>
          <div className="flex flex-col gap-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
            <div className="flex items-center justify-center gap-2">
              <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono" style={{ backgroundColor: 'var(--surface-alt)', border: '1px solid var(--border)' }}>Ctrl+K</kbd>
              <span>Search notes</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono" style={{ backgroundColor: 'var(--surface-alt)', border: '1px solid var(--border)' }}>j</kbd>
              <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono" style={{ backgroundColor: 'var(--surface-alt)', border: '1px solid var(--border)' }}>k</kbd>
              <span>Navigate notes</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const sections: SectionKey[] = ['deadlines', 'todos', 'followUps', 'flashCards']

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto space-y-2">
        {sections.map(sectionKey => {
          const config = SECTION_CONFIG[sectionKey]
          const Icon = config.icon
          const open = openSections.has(sectionKey)
          const items = data[sectionKey]
          return (
            <div key={sectionKey} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
              <button
                onClick={() => toggleSection(sectionKey)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium transition-colors"
                style={{ color: 'var(--text-primary)', backgroundColor: 'var(--surface)' }}
              >
                <span className="flex items-center gap-2">
                  <Icon size={14} style={{ color: config.color }} />
                  {config.label}
                  <span className="text-xs ml-1" style={{ color: 'var(--text-tertiary)' }}>{items.length}</span>
                </span>
                {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {open && (
                <div className="px-3 pb-3 space-y-1.5" style={{ backgroundColor: 'var(--surface)' }}>
                  {items.length === 0 ? (
                    <p className="text-xs italic" style={{ color: 'var(--text-tertiary)' }}>
                      No {config.label.toLowerCase()} found
                    </p>
                  ) : sectionKey === 'flashCards' ? (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {items.map((fc: any, idx: number) => (
                        <FlashCard key={idx} front={fc.front} back={fc.back} />
                      ))}
                    </div>
                  ) : (
                    items.map((item: any, idx: number) => (
                      <div key={idx} className="text-sm flex items-start gap-2 py-0.5" style={{ color: 'var(--text-secondary)' }}>
                        <span className="shrink-0 mt-0.5">
                          {sectionKey === 'deadlines' && '📅'}
                          {sectionKey === 'todos' && '☐'}
                          {sectionKey === 'followUps' && '↻'}
                        </span>
                        <span className="flex-1">{item.text}</span>
                        {item.date && (
                          <span className="text-xs shrink-0" style={{ color: config.color }}>
                            {item.date}
                          </span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function FlashCard({ front, back }: { front: string; back: string }) {
  const [revealed, setRevealed] = useState(false)
  return (
    <div
      onClick={() => setRevealed(!revealed)}
      className="cursor-pointer rounded pt-1"
      style={{ backgroundColor: 'var(--surface-alt)', border: '1px solid var(--border)' }}
    >
      {revealed ? (
        <div className="flex flex-col gap-0.5 py-1 px-2">
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{front}</span>
          <span style={{ color: 'var(--text-primary)' }}>
            <span className="font-medium">A:</span> {back}
          </span>
          <span className="text-[10px] mt-1" style={{ color: 'var(--text-tertiary)' }}>Click to hide</span>
        </div>
      ) : (
        <div className="flex flex-col gap-0.5 py-1 px-2">
          <span style={{ color: 'var(--text-primary)' }}>
            <span className="font-medium">Q:</span> {front}
          </span>
          <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>Click to reveal</span>
        </div>
      )}
    </div>
  )
}
