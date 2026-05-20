'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { loadAllNoteAnalyses, saveNoteAnalysis, getAuthToken } from '@/lib/supabase'
import type { NoteAnalysis } from '@/lib/types'
import { Calendar, CheckSquare, RefreshCw, BookOpen, ChevronUp, ChevronDown } from 'lucide-react'
import { OverviewSkeleton } from '@/components/ui/skeleton'

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
    return <OverviewSkeleton />
  }

  const totalItems = allTodos.length + allFollowUps.length + allDeadlines.length + randomCards.length

  if (totalItems === 0) {
    return (
      <div className="h-full flex items-center justify-center p-6" style={{ color: 'var(--text-tertiary)' }}>
        <div className="flex items-center gap-5 max-w-lg">
          <div className="w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'var(--surface-alt)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
          </div>
          <div className="flex items-center gap-4 min-w-0">
            <span className="text-sm whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>No note selected</span>
            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>·</span>
            <span className="flex items-center gap-1.5 text-xs shrink-0">
              <kbd className="px-1 py-0.5 rounded text-[10px] font-mono" style={{ backgroundColor: 'var(--surface-alt)', border: '1px solid var(--border)' }}>Ctrl+K</kbd>
              Search
            </span>
            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>·</span>
            <span className="flex items-center gap-1.5 text-xs shrink-0">
              <kbd className="px-1 py-0.5 rounded text-[10px] font-mono" style={{ backgroundColor: 'var(--surface-alt)', border: '1px solid var(--border)' }}>j</kbd>
              <kbd className="px-1 py-0.5 rounded text-[10px] font-mono" style={{ backgroundColor: 'var(--surface-alt)', border: '1px solid var(--border)' }}>k</kbd>
              Navigate
            </span>
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
    <div className="h-full p-6">
      <div className="h-full max-w-5xl mx-auto">
        <div className="grid grid-cols-4 gap-3 h-full">
          {sections.map(({ key, items }) => {
            const config = SECTION_CONFIG[key]
            const Icon = config.icon
            const open = openSections.has(key)
            const doneCount = items.filter(i => i.done).length
            return (
              <div key={key} className="flex flex-col overflow-hidden" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', alignSelf: open ? 'stretch' : 'start' }}>
                <button
                  onClick={() => toggleSection(key)}
                  className="flex items-center justify-between px-3 py-2 text-sm font-medium shrink-0 transition-colors"
                  style={{ color: 'var(--text-primary)', backgroundColor: 'var(--surface)' }}
                >
                  <span className="flex items-center gap-1.5">
                    <Icon size={13} style={{ color: config.color }} />
                    {config.label}
                    <span className="text-xs ml-0.5" style={{ color: 'var(--text-tertiary)' }}>
                      {doneCount > 0 ? `${doneCount}/${items.length}` : items.length}
                    </span>
                  </span>
                  {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {open && (
                  <div className="flex-1 overflow-y-auto px-3 pb-2 space-y-1" style={{ backgroundColor: 'var(--surface)' }}>
                    {items.length === 0 ? (
                      <p className="text-xs italic py-1" style={{ color: 'var(--text-tertiary)' }}>
                        None
                      </p>
                    ) : (
                      items.map((item, idx) => (
                        <div key={idx} className="text-xs flex items-start gap-1.5 py-0.5" style={{ color: 'var(--text-secondary)' }}>
                          <button
                            onClick={() => toggleDone(item.srcNoteId, key as 'todos' | 'followUps' | 'deadlines', item.srcIdx)}
                            className="shrink-0 mt-0.5 cursor-pointer hover:opacity-70 transition-opacity"
                            style={{ background: 'none', border: 'none', padding: 0, fontSize: 'inherit', lineHeight: 'inherit' }}
                          >
                            {item.done ? '☑' : '☐'}
                          </button>
                          <span className="flex-1 truncate" style={{
                            textDecoration: item.done ? 'line-through' : 'none',
                            opacity: item.done ? 0.4 : 1,
                          }}>{item.text}</span>
                          {item.date && (
                            <span className="text-[10px] shrink-0" style={{ color: config.color }}>
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

          {/* Flash Cards */}
          <div className="flex flex-col overflow-hidden" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', alignSelf: openSections.has('flashCards') ? 'stretch' : 'start' }}>
            <button
              onClick={() => toggleSection('flashCards')}
              className="flex items-center justify-between px-3 py-2 text-sm font-medium shrink-0 transition-colors"
              style={{ color: 'var(--text-primary)', backgroundColor: 'var(--surface)' }}
            >
              <span className="flex items-center gap-1.5">
                <BookOpen size={13} style={{ color: '#22c55e' }} />
                Flash Cards
                <span className="text-xs ml-0.5" style={{ color: 'var(--text-tertiary)' }}>{randomCards.length}</span>
              </span>
              {openSections.has('flashCards') ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {openSections.has('flashCards') && (
              <div className="flex-1 overflow-y-auto px-3 pb-2 space-y-1.5" style={{ backgroundColor: 'var(--surface)' }}>
                {randomCards.length === 0 ? (
                  <p className="text-xs italic py-1" style={{ color: 'var(--text-tertiary)' }}>None</p>
                ) : (
                  randomCards.map((fc, i) => (
                    <FlashCardMini key={i} front={fc.front} back={fc.back} />
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function FlashCardMini({ front, back }: { front: string; back: string }) {
  const [revealed, setRevealed] = useState(false)
  return (
    <div
      onClick={() => setRevealed(!revealed)}
      className="cursor-pointer rounded px-2 py-1.5 transition-colors"
      style={{ backgroundColor: 'var(--surface-alt)', border: '1px solid var(--border)' }}
    >
      <div className="flex flex-col gap-0.5">
        <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{front}</span>
        {revealed ? (
          <span className="text-xs" style={{ color: 'var(--text-primary)' }}>
            <span className="font-medium">A:</span> {back}
          </span>
        ) : (
          <input
            type="password"
            value={back}
            disabled
            readOnly
            className="text-xs bg-transparent border-0 p-0 m-0 outline-none cursor-pointer"
            style={{ color: 'var(--text-tertiary)', lineHeight: 'inherit' }}
          />
        )}
      </div>
    </div>
  )
}
