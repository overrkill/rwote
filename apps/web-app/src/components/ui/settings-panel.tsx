'use client'

import { useState } from 'react'
import { Cloud, Download, LogOut, Check, Loader2, ChevronDown } from 'lucide-react'
import type { User, AiSettings, SubscriptionStatus } from '@/lib/types'
import Avatar from './avatar'

interface SettingsPanelProps {
  isOpen: boolean
  onClose: () => void
  user: User | null
  subscription: SubscriptionStatus | null
  aiSettings: AiSettings
  currentTheme: string
  themeList: { id: string; name: string }[]
  onAiSettingsChange: (settings: AiSettings) => void
  onThemeChange: (themeId: string) => void
  onSubscriptionOpen: () => void
  onExport: () => void
  onSignOut: () => void
}

export default function SettingsPanel({
  isOpen,
  onClose,
  user,
  subscription,
  aiSettings,
  currentTheme,
  themeList,
  onAiSettingsChange,
  onThemeChange,
  onSubscriptionOpen,
  onExport,
  onSignOut,
}: SettingsPanelProps) {
  const [provider, setProvider] = useState(aiSettings.provider)
  const [ollamaUrl, setOllamaUrl] = useState(aiSettings.ollamaUrl)
  const [ollamaModel, setOllamaModel] = useState(aiSettings.ollamaModel)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null)
  const [aiExpanded, setAiExpanded] = useState(false)

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
  const currentProviderName = provider === 'disabled' ? 'Disabled' : provider === 'ollama' ? 'Ollama' : 'Groq'

  if (!isOpen) return null

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/20"
        onClick={onClose}
        style={{ backdropFilter: 'blur(2px)' }}
      />
      <div
        className="fixed top-0 right-0 h-full w-80 z-50 flex flex-col transition-transform duration-300 ease-out shadow-[-8px_0_30px_rgba(0,0,0,0.15)]"
        style={{ backgroundColor: 'var(--surface)' }}
      >
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
            <div 
              className="flex items-center justify-between px-4 py-3 cursor-pointer transition-colors rounded-lg"
              style={{ backgroundColor: 'var(--surface-alt)' }}
              onClick={() => setAiExpanded(!aiExpanded)}
            >
              <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{currentProviderName}</span>
              <ChevronDown size={14} style={{ color: 'var(--text-tertiary)', transform: aiExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </div>
            
            {aiExpanded && (
              <div className="mt-2 space-y-2">
                <select
                  value={provider}
                  onChange={(e) => {
                    setProvider(e.target.value as AiSettings['provider'])
                    setTimeout(handleSave, 0)
                  }}
                  className="w-full px-4 py-2.5 text-sm rounded-lg"
                  style={{ backgroundColor: 'var(--surface-alt)', color: 'var(--text-primary)' }}
                >
                  <option value="disabled">Disabled</option>
                  <option value="ollama">Ollama (Local)</option>
                  <option value="groq">Groq (Cloud)</option>
                </select>

                {provider === 'ollama' && (
                  <div className="space-y-3 pt-2">
                    <div>
                      <div className="text-xs mb-1.5 px-1" style={{ color: 'var(--text-secondary)' }}>Ollama URL</div>
                      <input
                        type="text"
                        value={ollamaUrl}
                        onChange={(e) => setOllamaUrl(e.target.value)}
                        onBlur={handleSave}
                        placeholder="http://localhost:11434"
                        className="w-full px-4 py-2.5 text-sm rounded-lg"
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
                        className="w-full px-4 py-2.5 text-sm rounded-lg"
                        style={{ backgroundColor: 'var(--surface-alt)', color: 'var(--text-primary)' }}
                      />
                    </div>
                    <button
                      onClick={handleTestConnection}
                      disabled={testing}
                      className="px-4 py-2 text-xs rounded-lg flex items-center gap-2 disabled:opacity-50"
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
                  <p className="text-xs pt-2" style={{ color: 'var(--text-secondary)' }}>Uses cloud summarization. Data sent to servers.</p>
                )}
              </div>
            )}
          </section>

          <section>
            <div className="text-xs font-medium mb-3" style={{ color: 'var(--text-tertiary)' }}>Appearance</div>
            <select
              value={currentTheme}
              onChange={(e) => onThemeChange(e.target.value)}
              className="w-full px-4 py-3 text-sm rounded-lg"
              style={{ backgroundColor: 'var(--surface-alt)', color: 'var(--text-primary)' }}
            >
              {themeList.map((theme) => (
                <option key={theme.id} value={theme.id}>{theme.name}</option>
              ))}
            </select>
          </section>

          <section>
            <div className="text-xs font-medium mb-3" style={{ color: 'var(--text-tertiary)' }}>Account</div>
            <button
              onClick={onSubscriptionOpen}
              className="w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors"
              style={{ backgroundColor: 'var(--surface-alt)' }}
            >
              <div className="flex items-center gap-3">
                <Cloud size={18} style={{ color: subscription?.subscription_status === 'paid' ? '#22c55e' : subscription?.subscription_status === 'trial' ? '#f59e0b' : 'var(--text-secondary)' }} />
                <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                  {subscription?.subscription_status === 'paid' && 'Pro'}
                  {subscription?.subscription_status === 'trial' && `Trial: ${subscription.days_left}d left`}
                  {subscription?.subscription_status === 'expired' && 'Expired'}
                  {!subscription?.subscription_status && 'Subscription'}
                </span>
              </div>
              <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--border)', color: 'var(--text-secondary)' }}>Manage</span>
            </button>
          </section>

          <section>
            <div className="text-xs font-medium mb-3" style={{ color: 'var(--text-tertiary)' }}>Data</div>
            <button
              onClick={onExport}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors"
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
            className="w-full px-4 py-2.5 text-sm rounded-lg flex items-center justify-center gap-2 transition-colors"
            style={{ backgroundColor: 'var(--surface-alt)', color: 'var(--text-primary)' }}
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </div>
    </>
  )
}