'use client'

import { useState, useEffect, useCallback } from 'react'
import type { NoteAnalysis, AiAnalyzeConfig, AiAnalyzeProvider } from '@/lib/types'
import { analyzeNoteDirect, loadNoteAnalysis, saveNoteAnalysis, getAuthToken, contentHash } from '@/lib/supabase'
import { loadAnalyzeConfig, saveAnalyzeConfig } from '@/lib/ai-config'
import { Sparkles, Calendar, CheckSquare, RefreshCw, BookOpen, AlertCircle, Loader2, ChevronDown, ChevronUp, Settings, Eye, EyeOff, PanelRightClose, PanelRightOpen, TriangleAlert } from 'lucide-react'

interface NoteAnalyzerProps {
  noteId: string
  text: string
  view: 'minimized' | 'expanded'
  onToggleView: () => void
}

type SectionKey = 'deadlines' | 'todos' | 'followUps' | 'flashCards'

const SECTION_CONFIG: Record<SectionKey, { icon: typeof Calendar; label: string; color: string }> = {
  deadlines:  { icon: Calendar,   label: 'Deadlines',   color: '#ef4444' },
  todos:      { icon: CheckSquare, label: 'To-Dos',      color: '#3b82f6' },
  followUps:  { icon: RefreshCw,  label: 'Follow-Ups',  color: '#f59e0b' },
  flashCards: { icon: BookOpen,   label: 'Flash Cards', color: '#8b5cf6' },
}

function EmptySection({ label }: { label: string }) {
  return (
    <p className="text-xs italic" style={{ color: 'var(--text-tertiary)' }}>
      No {label.toLowerCase()} found
    </p>
  )
}

function Section({
  sectionKey,
  analysis,
  open,
  onToggle,
}: {
  sectionKey: SectionKey
  analysis: NoteAnalysis
  open: boolean
  onToggle: () => void
}) {
  const config = SECTION_CONFIG[sectionKey]
  const items = analysis[sectionKey]
  const Icon = config.icon

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium transition-colors"
        style={{ color: 'var(--text-primary)', backgroundColor: 'var(--surface)' }}
      >
        <span className="flex items-center gap-2">
          <Icon size={14} style={{ color: config.color }} />
          {config.label}
          <span className="text-xs ml-1" style={{ color: 'var(--text-tertiary)' }}>
            {items.length}
          </span>
        </span>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-1.5" style={{ backgroundColor: 'var(--surface)' }}>
          {items.length === 0 ? (
            <EmptySection label={config.label} />
          ) : (
            items.map((item, idx) => (
              <div key={idx} className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {sectionKey === 'flashCards' ? (
                  <div className="flex flex-col gap-0.5 py-1">
                    <span style={{ color: 'var(--text-primary)' }}>
                      <span className="font-medium">Q:</span> {(item as any).front}
                    </span>
                    <span>
                      <span className="font-medium">A:</span> {(item as any).back}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 py-0.5">
                    <span className="shrink-0 mt-0.5">
                      {sectionKey === 'deadlines' && '📅'}
                      {sectionKey === 'todos' && '☐'}
                      {sectionKey === 'followUps' && '↻'}
                    </span>
                    <span className="flex-1">{(item as any).text}</span>
                    {'date' in item && (item as any).date && (
                      <span className="text-xs shrink-0" style={{ color: config.color }}>
                        {(item as any).date}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

function ConfigForm({
  config,
  onChange,
  onSave,
}: {
  config: AiAnalyzeConfig
  onChange: (c: AiAnalyzeConfig) => void
  onSave: () => void
}) {
  const [showKey, setShowKey] = useState(false)

  const providerOptions: { value: AiAnalyzeProvider; label: string }[] = [
    { value: 'openai', label: 'OpenAI-compatible' },
    { value: 'ollama', label: 'Ollama (local)' },
  ]

  const handleProviderChange = (provider: AiAnalyzeProvider) => {
    const defaults: Record<AiAnalyzeProvider, Partial<AiAnalyzeConfig>> = {
      openai: { baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
      ollama: { baseUrl: 'http://localhost:11434', model: 'llama3.2' },
    }
    onChange({ ...config, ...defaults[provider], provider })
  }

  return (
    <div className="space-y-2 px-3 py-3 rounded-md" style={{ backgroundColor: 'var(--surface-alt)', border: '1px solid var(--border)' }}>
      <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>AI Provider Settings</span>

      <div>
        <label className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Provider</label>
        <select
          value={config.provider}
          onChange={(e) => handleProviderChange(e.target.value as AiAnalyzeProvider)}
          className="w-full text-sm px-2 py-1.5 rounded mt-0.5 outline-none"
          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
        >
          {providerOptions.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Base URL</label>
        <input
          type="text"
          value={config.baseUrl}
          onChange={(e) => onChange({ ...config, baseUrl: e.target.value })}
          placeholder={config.provider === 'ollama' ? 'http://localhost:11434' : 'https://api.openai.com/v1'}
          className="w-full text-sm px-2 py-1.5 rounded mt-0.5 outline-none"
          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
        />
      </div>

      <div>
        <label className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Model</label>
        <input
          type="text"
          value={config.model}
          onChange={(e) => onChange({ ...config, model: e.target.value })}
          placeholder={config.provider === 'ollama' ? 'llama3.2' : 'gpt-4o-mini'}
          className="w-full text-sm px-2 py-1.5 rounded mt-0.5 outline-none"
          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
        />
      </div>

      {config.provider === 'openai' && (
        <div>
          <label className="text-xs" style={{ color: 'var(--text-tertiary)' }}>API Key</label>
          <div className="relative mt-0.5">
            <input
              type={showKey ? 'text' : 'password'}
              value={config.apiKey}
              onChange={(e) => onChange({ ...config, apiKey: e.target.value })}
              placeholder="sk-..."
              className="w-full text-sm px-2 py-1.5 pr-8 rounded outline-none"
              style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            />
            <button
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--text-tertiary)' }}
            >
              {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>
      )}

      <button
        onClick={onSave}
        className="w-full text-xs font-medium px-3 py-1.5 rounded mt-1 transition-colors"
        style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
      >
        Save Settings
      </button>
    </div>
  )
}

function needsConfig(config: AiAnalyzeConfig): boolean {
  if (!config.baseUrl || !config.model) return true
  if (config.provider === 'openai' && !config.apiKey) return true
  return false
}

function MinimizedStrip({
  analysis,
  status,
  stale,
  onToggleView,
}: {
  analysis: NoteAnalysis | null
  status: 'idle' | 'loading' | 'success' | 'error'
  stale: boolean
  onToggleView: () => void
}) {
  const totalItems = analysis
    ? analysis.deadlines.length + analysis.todos.length + analysis.followUps.length + analysis.flashCards.length
    : 0

  return (
    <div className="flex flex-col items-center gap-3 py-3" style={{ cursor: 'pointer' }} onClick={onToggleView}>
      {analysis ? (
        <>
          <span title={`${totalItems} items${stale ? ' (stale)' : ''}`} className="flex flex-col items-center gap-0.5">
            {stale ? (
              <TriangleAlert size={16} style={{ color: '#f59e0b' }} />
            ) : (
              <Sparkles size={16} style={{ color: 'var(--accent)' }} />
            )}
            <span className="text-[10px] font-bold" style={{ color: stale ? '#f59e0b' : 'var(--accent)' }}>{totalItems}</span>
          </span>
          {(Object.keys(SECTION_CONFIG) as SectionKey[]).map((key) => {
            const cfg = SECTION_CONFIG[key]
            const count = analysis[key].length
            if (count === 0) return null
            const Icon = cfg.icon
            return (
              <span key={key} title={`${cfg.label}: ${count}`} className="flex flex-col items-center gap-0.5">
                <Icon size={14} style={{ color: stale ? `${cfg.color}80` : cfg.color }} />
                <span className="text-[10px] font-bold" style={{ color: stale ? `${cfg.color}80` : cfg.color }}>{count}</span>
              </span>
            )
          })}
        </>
      ) : (
        <>
          <Sparkles size={16} style={{ color: 'var(--text-tertiary)' }} />
          {(Object.keys(SECTION_CONFIG) as SectionKey[]).map((key) => {
            const Icon = SECTION_CONFIG[key].icon
            return <Icon key={key} size={14} style={{ color: 'var(--text-tertiary)', opacity: 0.3 }} />
          })}
        </>
      )}
      <PanelRightOpen size={14} style={{ color: 'var(--text-tertiary)', marginTop: 'auto' }} />
    </div>
  )
}

export default function NoteAnalyzer({ noteId, text, view, onToggleView }: NoteAnalyzerProps) {
  const [config, setConfig] = useState<AiAnalyzeConfig>(() => loadAnalyzeConfig())
  const [analysis, setAnalysis] = useState<NoteAnalysis | null>(null)
  const [storedHash, setStoredHash] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [error, setError] = useState('')
  const [showConfig, setShowConfig] = useState(needsConfig(loadAnalyzeConfig()))
  const [openSections, setOpenSections] = useState<Set<SectionKey>>(new Set(['deadlines', 'todos', 'followUps', 'flashCards']))

  const currentHash = contentHash({ title: '', content: text })
  const stale = !!(analysis && storedHash !== null && storedHash !== currentHash)

  const loadFromDb = useCallback(async () => {
    const token = await getAuthToken()
    if (!token) return
    const cached = await loadNoteAnalysis(noteId, token)
    if (cached) {
      setAnalysis(cached.analysis)
      setStoredHash(cached.contentHash)
      setStatus('success')
    }
  }, [noteId])

  useEffect(() => {
    setAnalysis(null)
    setStoredHash(null)
    setStatus('idle')
    setError('')
    loadFromDb()
  }, [noteId, loadFromDb])

  const toggleSection = (key: SectionKey) => {
    setOpenSections(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const handleSaveConfig = () => {
    saveAnalyzeConfig(config)
    setShowConfig(false)
  }

  const handleAnalyze = async () => {
    if (!text.trim() || needsConfig(config)) return

    setStatus('loading')
    setError('')
    try {
      const result = await analyzeNoteDirect(text, config)
      setAnalysis(result)
      setStoredHash(currentHash)
      setStatus('success')

      const token = await getAuthToken()
      if (token) {
        await saveNoteAnalysis(noteId, result, currentHash, token).catch(console.error)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analysis failed')
      setStatus('error')
    }
  }

  const hasContent = text.trim().length > 0
  const configMissing = needsConfig(config)

  if (view === 'minimized') {
    if (status === 'loading') {
      return (
        <div className="flex flex-col items-center py-4" style={{ color: 'var(--accent)' }}>
          <Loader2 size={16} className="animate-spin" />
        </div>
      )
    }

    return (
      <MinimizedStrip
        analysis={analysis}
        status={status}
        stale={stale}
        onToggleView={onToggleView}
      />
    )
  }

  if (!analysis && status !== 'error') {
    return (
      <div className="space-y-2 py-3 px-3">
        {showConfig && (
          <ConfigForm
            config={config}
            onChange={setConfig}
            onSave={handleSaveConfig}
          />
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={handleAnalyze}
            disabled={status === 'loading' || !hasContent}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all disabled:opacity-40"
            style={{
              backgroundColor: configMissing ? 'var(--surface-alt)' : 'var(--accent)',
              color: configMissing ? 'var(--text-tertiary)' : '#fff',
            }}
          >
            {status === 'loading' ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Sparkles size={14} />
            )}
            {status === 'loading' ? 'Analyzing...' : 'Analyze with AI'}
          </button>

          <button
            onClick={() => setShowConfig(!showConfig)}
            className="p-1.5 rounded-md transition-colors"
            style={{ color: showConfig ? 'var(--accent)' : 'var(--text-tertiary)' }}
            title="AI Settings"
          >
            <Settings size={14} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2 py-3 px-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
          <Sparkles size={12} style={{ color: stale ? '#f59e0b' : 'var(--accent)' }} />
          AI Analysis
          {stale && (
            <span className="text-xs flex items-center gap-0.5" style={{ color: '#f59e0b' }}>
              <TriangleAlert size={10} />
              stale
            </span>
          )}
          {status === 'success' && !stale && (
            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              · {
                (analysis!.deadlines.length + analysis!.todos.length + analysis!.followUps.length + analysis!.flashCards.length)
              } items
            </span>
          )}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleView}
            className="p-1 rounded transition-colors"
            style={{ color: 'var(--text-tertiary)' }}
            title="Minimize panel"
          >
            <PanelRightClose size={12} />
          </button>
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="p-1 rounded transition-colors"
            style={{ color: 'var(--text-tertiary)' }}
            title="AI Settings"
          >
            <Settings size={12} />
          </button>
          <button
            onClick={handleAnalyze}
            disabled={status === 'loading'}
            className="text-xs flex items-center gap-1 px-2 py-1 rounded transition-colors disabled:opacity-40"
            style={{ color: stale ? '#f59e0b' : 'var(--accent)' }}
          >
            {status === 'loading' ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <RefreshCw size={12} />
            )}
            {stale ? 'Update' : 'Re-analyze'}
          </button>
        </div>
      </div>

      {showConfig && (
        <ConfigForm
          config={config}
          onChange={setConfig}
          onSave={handleSaveConfig}
        />
      )}

      {status === 'error' && (
        <div className="flex items-center gap-2 px-3 py-2 text-xs rounded-md" style={{ backgroundColor: '#fef2f2', color: '#ef4444' }}>
          <AlertCircle size={12} />
          {error}
        </div>
      )}

      {analysis && (
        <div className="space-y-1.5">
          {(Object.keys(SECTION_CONFIG) as SectionKey[]).map((key) => (
            <Section
              key={key}
              sectionKey={key}
              analysis={analysis}
              open={openSections.has(key)}
              onToggle={() => toggleSection(key)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
