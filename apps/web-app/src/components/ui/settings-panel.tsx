'use client'

import { useState } from 'react'
import { Download, LogOut, Check, Loader2 } from 'lucide-react'
import type { User, AiSettings } from '@/lib/types'
import Avatar from './avatar'
import SideSheet from './side-sheet'

interface SettingsPanelProps {
  isOpen: boolean
  onClose: () => void
  user: User | null
  aiSettings: AiSettings
  currentTheme: string
  themeList: { id: string; name: string }[]
  onAiSettingsChange: (settings: AiSettings) => void
  onThemeChange: (themeId: string) => void
  onExport: () => void
  onSignOut: () => void
}

export default function SettingsPanel({
  isOpen,
  onClose,
  user,
  aiSettings,
  currentTheme,
  themeList,
  onAiSettingsChange,
  onThemeChange,
  onExport,
  onSignOut,
}: SettingsPanelProps) {
  const [provider, setProvider] = useState(aiSettings.provider)
  const [ollamaUrl, setOllamaUrl] = useState(aiSettings.ollamaUrl)
  const [ollamaModel, setOllamaModel] = useState(aiSettings.ollamaModel)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null)

  const handleSave = () => {
    onAiSettingsChange({ provider, ollamaUrl, ollamaModel })
  }

  const handleTestConnection = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const response = await fetch(`${ollamaUrl}/api/tags`)
      if (response.ok) {
        setTestResult('success')
      } else {
        setTestResult('error')
      }
    } catch {
      setTestResult('error')
    }
    setTesting(false)
  }

  const currentThemeName = themeList.find(t => t.id === currentTheme)?.name || 'Theme'

  return (
    <SideSheet open={isOpen} onClose={onClose}>
      <div className="p-5 flex items-center gap-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <Avatar user={user} size={44} />
        <div className="flex-1 min-w-0">
          <div className="text-base font-medium truncate" style={{ color: 'var(--text-primary)' }}>{user?.name || 'User'}</div>
          <div className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>{user?.email}</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <section>
          <div className="text-xs font-medium mb-3" style={{ color: 'var(--text-tertiary)' }}>AI Summarization</div>
          <select
            value={provider}
            onChange={(e) => {
              const newProvider = e.target.value as AiSettings['provider']
              setProvider(newProvider)
              onAiSettingsChange({ provider: newProvider, ollamaUrl, ollamaModel })
            }}
            className="w-full px-4 py-2.5 text-sm rounded"
            style={{ backgroundColor: 'var(--surface-alt)', color: 'var(--text-primary)' }}
          >
            <option value="disabled">Disabled</option>
            <option value="groq">Groq</option>
            <option value="ollama">Local</option>
          </select>

          {provider === 'ollama' && (
            <div className="mt-3 space-y-3">
              <div>
                <div className="text-xs mb-1.5 px-1" style={{ color: 'var(--text-secondary)' }}>Ollama URL</div>
                <input
                  type="text"
                  value={ollamaUrl}
                  onChange={(e) => setOllamaUrl(e.target.value)}
                  onBlur={handleSave}
                  placeholder="http://localhost:11434"
                  className="w-full px-4 py-2.5 text-sm rounded"
                  style={{ backgroundColor: 'var(--surface-alt)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <div className="text-xs mb-1.5 px-1" style={{ color: 'var(--text-secondary)' }}>Model</div>
                <input
                  type="text"
                  value={ollamaModel}
                  onChange={(e) => setOllamaModel(e.target.value)}
                  onBlur={handleSave}
                  placeholder="llama3.2"
                  className="w-full px-4 py-2.5 text-sm rounded"
                  style={{ backgroundColor: 'var(--surface-alt)', color: 'var(--text-primary)' }}
                />
              </div>
              <button
                onClick={handleTestConnection}
                disabled={testing}
                className="px-4 py-2 text-xs rounded flex items-center gap-2 disabled:opacity-50"
                style={{ backgroundColor: 'var(--accent)', color: 'white' }}
              >
                {testing ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                {testing ? 'Testing...' : 'Test Connection'}
              </button>
              {testResult === 'success' && (
                <p className="text-xs px-1 flex items-center gap-1" style={{ color: '#22c55e' }}>Connected successfully</p>
              )}
              {testResult === 'error' && (
                <p className="text-xs px-1" style={{ color: '#ef4444' }}>Connection failed. Check URL and restart Ollama.</p>
              )}
            </div>
          )}

          {provider === 'groq' && (
            <p className="text-xs mt-3" style={{ color: 'var(--text-secondary)' }}>Uses cloud summarization. Data sent to servers.</p>
          )}
        </section>

        <section>
          <div className="text-xs font-medium mb-3" style={{ color: 'var(--text-tertiary)' }}>Appearance</div>
          <select
            value={currentTheme}
            onChange={(e) => onThemeChange(e.target.value)}
            className="w-full px-4 py-3 text-sm rounded"
            style={{ backgroundColor: 'var(--surface-alt)', color: 'var(--text-primary)' }}
          >
            {themeList.map((theme) => (
              <option key={theme.id} value={theme.id}>{theme.name}</option>
            ))}
          </select>
        </section>

        <section>
          <div className="text-xs font-medium mb-3" style={{ color: 'var(--text-tertiary)' }}>Data</div>
          <button
            onClick={onExport}
            className="w-full flex items-center gap-3 px-4 py-3 rounded transition-colors"
            style={{ backgroundColor: 'var(--surface-alt)' }}
          >
            <Download size={16} style={{ color: 'var(--text-secondary)' }} />
            <span className="text-sm" style={{ color: 'var(--text-primary)' }}>Export Notes</span>
          </button>
        </section>
      </div>

      <div className="p-4" style={{ borderTop: '1px solid var(--border)' }}>
        <button
          onClick={onSignOut}
          className="w-full px-4 py-2.5 text-sm rounded flex items-center justify-center gap-2 transition-colors"
          style={{ backgroundColor: 'var(--surface-alt)', color: 'var(--text-primary)' }}
        >
          <LogOut size={14} />
          Sign Out
        </button>
      </div>
    </SideSheet>
  )
}
