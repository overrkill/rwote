'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { loadAllNoteAnalyses, saveNoteAnalysis, getAuthToken } from '@/lib/supabase'
import type { NoteAnalysis } from '@/lib/types'
import { Calendar, CheckSquare, RefreshCw, BookOpen, ChevronUp, ChevronDown } from 'lucide-react'

type SectionKey = 'todos' | 'followUps' | 'deadlines' | 'flashCards'

const SECTION_CONFIG: Record<SectionKey, { icon: typeof Calendar; label: string; color: string }> = {
  deadlines:  { icon: Calendar,   label: 'Deadlines',   color: '#ef4444' },
  todos:      { icon: CheckSquare, label: 'To-Dos',      color: '#3b82f6' },
  followUps:  { icon: RefreshCw,  label: 'Follow-ups',  color: '#a855f7' },
  flashCards: { icon: BookOpen,   label: 'Flash Cards', color: '#22c55e' },
}

interface AggregatedItem {
  text: string
  date?: string
  done?: boolean
  srcNoteId: string
  srcIdx: number
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function NoteOverview() {
  const [records, setRecords] = useState<Record<string, { analysis: NoteAnalysis; contentHash: string }>>({})
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
    loadAllNoteAnalyses()
      .then(setRecords)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const allTodos = useMemo<AggregatedItem[]>(() => {
    const r: AggregatedItem[] = []
    for (const [noteId, rec] of Object.entries(records)) {
      (rec.analysis.todos || []).forEach((t, i) => r.push({ text: t.text, done: t.done, srcNoteId: noteId, srcIdx: i }))
    }
    return r
  }, [records])

  const allFollowUps = useMemo<AggregatedItem[]>(() => {
    const r: AggregatedItem[] = []
    for (const [noteId, rec] of Object.entries(records)) {
      (rec.analysis.followUps || []).forEach((f, i) => r.push({ text: f.text, date: f.date, done: f.done, srcNoteId: noteId, srcIdx: i }))
    }
    return r
  }, [records])

  const allDeadlines = useMemo<AggregatedItem[]>(() => {
    const r: AggregatedItem[] = []
    for (const [noteId, rec] of Object.entries(records)) {
      (rec.analysis.deadlines || []).forEach((d, i) => r.push({ text: d.text, date: d.date, done: d.done, srcNoteId: noteId, srcIdx: i }))
    }
    return r
  }, [records])

  const randomCards = useMemo(() => {
    const all: { front: string; back: string }[] = []
    for (const rec of Object.values(records)) {
      all.push(...(rec.analysis.flashCards || []))
    }
    return shuffle(all).slice(0, 4)
  }, [records])

  const toggleDone = useCallback(async (noteId: string, section: 'todos' | 'followUps' | 'deadlines', idx: number) => {
    const rec = records[noteId]
    if (!rec) return

    const items = [...rec.analysis[section]] as any[]
    const item = { ...items[idx] }
    item.done = !item.done
    items[idx] = item

    const updated = {
      ...records,
      [noteId]: {
        ...rec,
        analysis: { ...rec.analysis, [section]: items },
      },
    }
    setRecords(updated)

    const token = await getAuthToken()
    if (token) {
      saveNoteAnalysis(noteId, updated[noteId].analysis, rec.contentHash, token).catch(console.error)
    }
  }, [records])

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center" style={{ color: 'var(--text-tertiary)' }}>
        <div style={{ color: 'var(--text-tertiary)' }}>Loading overview...</div>
      </div>
    )
  }

  const totalItems = allTodos.length + allFollowUps.length + allDeadlines.length + randomCards.length

  if (totalItems === 0) {
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

  const sections: { key: SectionKey; items: AggregatedItem[] }[] = [
    { key: 'deadlines', items: allDeadlines },
    { key: 'todos', items: allTodos },
    { key: 'followUps', items: allFollowUps },
  ]

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto space-y-2">
        {sections.map(({ key, items }) => {
          const config = SECTION_CONFIG[key]
          const Icon = config.icon
          const open = openSections.has(key)
          const doneCount = items.filter(i => i.done).length
          return (
            <div key={key} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
              <button
                onClick={() => toggleSection(key)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium transition-colors"
                style={{ color: 'var(--text-primary)', backgroundColor: 'var(--surface)' }}
              >
                <span className="flex items-center gap-2">
                  <Icon size={14} style={{ color: config.color }} />
                  {config.label}
                  <span className="text-xs ml-1" style={{ color: 'var(--text-tertiary)' }}>
                    {doneCount > 0 ? `${doneCount}/${items.length}` : items.length}
                  </span>
                </span>
                {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {open && (
                <div className="px-3 pb-3 space-y-1.5" style={{ backgroundColor: 'var(--surface)' }}>
                  {items.length === 0 ? (
                    <p className="text-xs italic" style={{ color: 'var(--text-tertiary)' }}>
                      No {config.label.toLowerCase()} found
                    </p>
                  ) : (
                    items.map((item, idx) => (
                      <div key={idx} className="text-sm flex items-start gap-2 py-0.5" style={{ color: 'var(--text-secondary)' }}>
                        <button
                          onClick={() => toggleDone(item.srcNoteId, key as 'todos' | 'followUps' | 'deadlines', item.srcIdx)}
                          className="shrink-0 mt-0.5 cursor-pointer hover:opacity-70 transition-opacity"
                          style={{ background: 'none', border: 'none', padding: 0, fontSize: 'inherit', lineHeight: 'inherit' }}
                        >
                          {item.done ? '☑' : '☐'}
                        </button>
                        <span className="flex-1" style={{
                          textDecoration: item.done ? 'line-through' : 'none',
                          opacity: item.done ? 0.4 : 1,
                        }}>{item.text}</span>
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

        {randomCards.length > 0 && (
          <div key="flashCards" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
            <div
              className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium"
              style={{ color: 'var(--text-primary)', backgroundColor: 'var(--surface)' }}
            >
              <span className="flex items-center gap-2">
                <BookOpen size={14} style={{ color: '#22c55e' }} />
                Flash Cards
                <span className="text-xs ml-1" style={{ color: 'var(--text-tertiary)' }}>{randomCards.length}</span>
              </span>
            </div>
            <div className="px-3 pb-3 space-y-1.5" style={{ backgroundColor: 'var(--surface)' }}>
              <div className="grid grid-cols-2 gap-2 pt-1">
                {randomCards.map((fc, i) => (
                  <FlashCard key={i} front={fc.front} back={fc.back} />
                ))}
              </div>
            </div>
          </div>
        )}
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
