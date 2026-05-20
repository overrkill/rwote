'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  getAuthToken,
  getAuthUser,
  signOut,
  loadNotes,
  saveUserSettings,
  type UserSettings,
} from '@/lib/supabase'
import { loadAnalyzeConfig, saveAnalyzeConfig } from '@/lib/ai-config'
import { useTheme } from '@/components/providers/theme-provider'
import Avatar from '@/components/ui/avatar'
import type { User, AiAnalyzeConfig, AiAnalyzeProvider } from '@/lib/types'
import { ArrowLeft, Download, LogOut, Heart, Check, Loader2, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'

const THEME_LIST = [
  { id: 'paper_dark', name: 'Paper Dark' },
  { id: 'tokyonight', name: 'Tokyo Night' },
  { id: 'tokyonight_light', name: 'Tokyo Night Light' },
  { id: 'catppuccin', name: 'Catppuccin' },
  { id: 'catppuccin_light', name: 'Catppuccin Latte' },
  { id: 'nord', name: 'Nord' },
  { id: 'nord_light', name: 'Nord Frost' },
  { id: 'ayu', name: 'Ayu Dark' },
  { id: 'ayu_light', name: 'Ayu Mirage' },
  { id: 'monokai', name: 'Monokai' },
  { id: 'monokai_light', name: 'Monokai Pro' },
]

export default function SettingsPage() {
  const router = useRouter()
  const { themeId, setTheme } = useTheme()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // AI Summarization
  const [aiProvider, setAiProvider] = useState<UserSettings['aiProvider']>('disabled')
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434')
  const [ollamaModel, setOllamaModel] = useState('llama3.2')
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null)

  // AI Analyze
  const [analyzeConfig, setAnalyzeConfig] = useState<AiAnalyzeConfig>(() => loadAnalyzeConfig())
  const [analyzeSaved, setAnalyzeSaved] = useState(false)
  const [showKey, setShowKey] = useState(false)

  // Export
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    async function init() {
      const token = await getAuthToken()
      if (!token) { router.push('/auth/login'); return }
      const currentUser = await getAuthUser()
      if (!currentUser) { router.push('/auth/login'); return }
      setUser(currentUser)
      setLoading(false)
    }
    init()
  }, [router])

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const token = await getAuthToken()
      if (!token) return
      const { notes } = await loadNotes(token)
      const data = JSON.stringify(notes, null, 2)
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `rwote-backup-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error('Export failed:', e)
    }
    setExporting(false)
  }

  const handleThemeChange = (id: string) => {
    setTheme(id)
    saveUserSettings({ theme: id })
  }

  const handleAiSummarizationChange = (provider: UserSettings['aiProvider']) => {
    setAiProvider(provider)
    saveUserSettings({ aiProvider: provider, aiOllamaUrl: ollamaUrl, aiOllamaModel: ollamaModel })
  }

  const handleTestConnection = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetch(`${ollamaUrl}/api/tags`)
      setTestResult(res.ok ? 'success' : 'error')
    } catch { setTestResult('error') }
    setTesting(false)
  }

  const handleSaveAnalyzeConfig = () => {
    saveAnalyzeConfig(analyzeConfig)
    setAnalyzeSaved(true)
    setTimeout(() => setAnalyzeSaved(false), 2000)
  }

  const handleAnalyzeProviderChange = (provider: AiAnalyzeProvider) => {
    const defaults: Record<AiAnalyzeProvider, Partial<AiAnalyzeConfig>> = {
      openai: { baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
      ollama: { baseUrl: 'http://localhost:11434', model: 'llama3.2' },
    }
    setAnalyzeConfig({ ...analyzeConfig, ...defaults[provider], provider })
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg)' }}>
        <div style={{ color: 'var(--text-secondary)' }}>Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>
      <header className="px-4 py-3 flex items-center gap-3" style={{ backgroundColor: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <Link
          href="/dashboard"
          className="p-1.5 rounded-md transition-colors hover:opacity-70"
          style={{ color: 'var(--text-secondary)' }}
        >
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-lg" style={{ fontFamily: "'Grand Hotel', cursive", color: 'var(--text-primary)' }}>
          Settings
        </h1>
      </header>

      <div className="max-w-lg mx-auto p-4 space-y-6">
        {/* Profile */}
        <section className="flex items-center gap-4 p-4 rounded-lg" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
          <Avatar user={user} size={44} />
          <div className="flex-1 min-w-0">
            <div className="text-base font-medium truncate" style={{ color: 'var(--text-primary)' }}>{user?.name || 'User'}</div>
            <div className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>{user?.email}</div>
          </div>
        </section>

        {/* AI Summarization */}
        <section className="p-4 rounded-lg space-y-3" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
          <h2 className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>AI Summarization</h2>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Auto-summarize notes when you save a title without content.
          </p>
          <select
            value={aiProvider}
            onChange={(e) => handleAiSummarizationChange(e.target.value as UserSettings['aiProvider'])}
            className="w-full px-4 py-2.5 text-sm rounded outline-none"
            style={{ backgroundColor: 'var(--surface-alt)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
          >
            <option value="disabled">Disabled</option>
            <option value="groq">Groq (Cloud)</option>
            <option value="ollama">Local (Ollama)</option>
          </select>

          {aiProvider === 'ollama' && (
            <div className="space-y-3">
              <div>
                <label className="text-xs block mb-1" style={{ color: 'var(--text-secondary)' }}>Ollama URL</label>
                <input
                  type="text"
                  value={ollamaUrl}
                  onChange={(e) => { setOllamaUrl(e.target.value); saveUserSettings({ aiOllamaUrl: e.target.value }) }}
                  placeholder="http://localhost:11434"
                  className="w-full px-4 py-2.5 text-sm rounded outline-none"
                  style={{ backgroundColor: 'var(--surface-alt)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                />
              </div>
              <div>
                <label className="text-xs block mb-1" style={{ color: 'var(--text-secondary)' }}>Model</label>
                <input
                  type="text"
                  value={ollamaModel}
                  onChange={(e) => { setOllamaModel(e.target.value); saveUserSettings({ aiOllamaModel: e.target.value }) }}
                  placeholder="llama3.2"
                  className="w-full px-4 py-2.5 text-sm rounded outline-none"
                  style={{ backgroundColor: 'var(--surface-alt)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                />
              </div>
              <button
                onClick={handleTestConnection}
                disabled={testing}
                className="px-4 py-2 text-xs rounded flex items-center gap-2 disabled:opacity-50 transition-colors"
                style={{ backgroundColor: 'var(--accent)', color: 'white' }}
              >
                {testing ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                {testing ? 'Testing...' : 'Test Connection'}
              </button>
              {testResult === 'success' && <p className="text-xs" style={{ color: '#22c55e' }}>Connected successfully</p>}
              {testResult === 'error' && <p className="text-xs" style={{ color: '#ef4444' }}>Connection failed</p>}
            </div>
          )}
          {aiProvider === 'groq' && (
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Uses cloud summarization via Anyscale API. Data sent to external servers.</p>
          )}
        </section>

        {/* AI Note Analysis */}
        <section className="p-4 rounded-lg space-y-3" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
          <h2 className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>AI Note Analysis</h2>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Extract deadlines, todos, follow-ups, and flash cards from notes. Stored locally in your browser.
          </p>

          <div>
            <label className="text-xs block mb-1" style={{ color: 'var(--text-secondary)' }}>Provider</label>
            <select
              value={analyzeConfig.provider}
              onChange={(e) => handleAnalyzeProviderChange(e.target.value as AiAnalyzeProvider)}
              className="w-full px-4 py-2.5 text-sm rounded outline-none"
              style={{ backgroundColor: 'var(--surface-alt)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
            >
              <option value="openai">OpenAI-compatible</option>
              <option value="ollama">Ollama (local)</option>
            </select>
          </div>

          <div>
            <label className="text-xs block mb-1" style={{ color: 'var(--text-secondary)' }}>Base URL</label>
            <input
              type="text"
              value={analyzeConfig.baseUrl}
              onChange={(e) => setAnalyzeConfig({ ...analyzeConfig, baseUrl: e.target.value })}
              placeholder={analyzeConfig.provider === 'ollama' ? 'http://localhost:11434' : 'https://api.openai.com/v1'}
              className="w-full px-4 py-2.5 text-sm rounded outline-none"
              style={{ backgroundColor: 'var(--surface-alt)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
            />
          </div>

          <div>
            <label className="text-xs block mb-1" style={{ color: 'var(--text-secondary)' }}>Model</label>
            <input
              type="text"
              value={analyzeConfig.model}
              onChange={(e) => setAnalyzeConfig({ ...analyzeConfig, model: e.target.value })}
              placeholder={analyzeConfig.provider === 'ollama' ? 'llama3.2' : 'gpt-4o-mini'}
              className="w-full px-4 py-2.5 text-sm rounded outline-none"
              style={{ backgroundColor: 'var(--surface-alt)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
            />
          </div>

          {analyzeConfig.provider === 'openai' && (
            <div>
              <label className="text-xs block mb-1" style={{ color: 'var(--text-secondary)' }}>API Key</label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={analyzeConfig.apiKey}
                  onChange={(e) => setAnalyzeConfig({ ...analyzeConfig, apiKey: e.target.value })}
                  placeholder="sk-..."
                  className="w-full px-4 py-2.5 pr-10 text-sm rounded outline-none"
                  style={{ backgroundColor: 'var(--surface-alt)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                />
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          )}

          <button
            onClick={handleSaveAnalyzeConfig}
            className="w-full px-4 py-2 text-xs font-medium rounded flex items-center justify-center gap-2 transition-colors"
            style={{ backgroundColor: 'var(--accent)', color: 'white' }}
          >
            {analyzeSaved ? <><Check size={12} /> Saved</> : 'Save Settings'}
          </button>
        </section>

        {/* Appearance */}
        <section className="p-4 rounded-lg space-y-3" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
          <h2 className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>Appearance</h2>
          <select
            value={themeId}
            onChange={(e) => handleThemeChange(e.target.value)}
            className="w-full px-4 py-3 text-sm rounded outline-none"
            style={{ backgroundColor: 'var(--surface-alt)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
          >
            {THEME_LIST.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </section>

        {/* Data */}
        <section className="p-4 rounded-lg space-y-3" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
          <h2 className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>Data</h2>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="w-full flex items-center gap-3 px-4 py-3 rounded transition-colors disabled:opacity-50"
            style={{ backgroundColor: 'var(--surface-alt)' }}
          >
            {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} style={{ color: 'var(--text-secondary)' }} />}
            <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{exporting ? 'Exporting...' : 'Export Notes'}</span>
          </button>
        </section>

        {/* Support */}
        <section className="p-4 rounded-lg space-y-3" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
          <h2 className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>Support</h2>
          <a
            href="https://ko-fi.com/abhishekkr"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center gap-3 px-4 py-3 rounded transition-colors"
            style={{ backgroundColor: 'var(--surface-alt)', color: 'var(--text-primary)', textDecoration: 'none' }}
          >
            <Heart size={16} style={{ color: 'var(--accent)' }} />
            <span className="text-sm">Support Rwote on Ko-fi</span>
          </a>
        </section>

        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          className="w-full px-4 py-2.5 text-sm rounded flex items-center justify-center gap-2 transition-colors"
          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
        >
          <LogOut size={14} /> Sign Out
        </button>

        <div className="pb-8" />
      </div>
    </div>
  )
}
