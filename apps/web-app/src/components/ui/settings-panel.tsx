'use client'

import { useState } from 'react'
import { Cloud, Download, LogOut, Check, Loader2, ChevronRight } from 'lucide-react'
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
        className="fixed inset-0 z-40 bg-black/30"
        onClick={onClose}
        style={{ backdropFilter: 'blur(2px)' }}
      />
      <div
        className="fixed top-0 right-0 h-full w-full max-w-sm z-50 flex flex-col transition-transform duration-300 ease-out shadow-2xl"
        style={{ backgroundColor: 'var(--surface)', borderLeft: '1px solid var(--border)' }}
      >
        <div className="p-4 flex items-center gap-3 shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
          <Avatar user={user} size={40} />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{user?.name || 'User'}</div>
            <div className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{user?.email}</div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          <div className="px-2">
            <div className="px-2 py-1.5 text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>AI</div>
            <div 
              className="flex items-center justify-between px-3 py-3 rounded-md cursor-pointer transition-colors"
              style={{ backgroundColor: 'var(--surface-alt)' }}
            >
              <div>
                <div className="text-sm" style={{ color: 'var(--text-primary)' }}>Provider</div>
                <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{currentProviderName}</div>
              </div>
              <select
                value={provider}
                onChange={(e) => {
                  setProvider(e.target.value as AiSettings['provider'])
                  setTimeout(handleSave, 0)
                }}
                className="text-sm px-2 py-1 rounded"
                style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              >
                <option value="disabled">Disabled</option>
                <option value="ollama">Ollama</option>
                <option value="groq">Groq</option>
              </select>
            </div>

            {provider === 'ollama' && (
              <>
                <div className="mt-2 space-y-2 px-2">
                  <div>
                    <div className="text-xs px-3 py-1" style={{ color: 'var(--text-tertiary)' }}>URL</div>
                    <input
                      type="text"
                      value={ollamaUrl}
                      onChange={(e) => setOllamaUrl(e.target.value)}
                      onBlur={handleSave}
                      placeholder="http://localhost:11434"
                      className="w-full px-3 py-2 text-sm rounded-md"
                      style={{ backgroundColor: 'var(--surface-alt)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    />
                  </div>
                  <div>
                    <div className="text-xs px-3 py-1" style={{ color: 'var(--text-tertiary)' }}>Model</div>
                    <input
                      type="text"
                      value={ollamaModel}
                      onChange={(e) => setOllamaModel(e.target.value)}
                      onBlur={handleSave}
                      placeholder="llama3.2"
                      className="w-full px-3 py-2 text-sm rounded-md"
                      style={{ backgroundColor: 'var(--surface-alt)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    />
                  </div>
                </div>
                <div className="mt-2 px-2">
                  <button
                    onClick={handleTestConnection}
                    disabled={testing}
                    className="w-full px-3 py-2 text-xs rounded-md flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                    style={{ backgroundColor: 'var(--surface-alt)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                  >
                    {testing ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                    {testing ? 'Testing...' : 'Test Connection'}
                  </button>
                  {testResult === 'success' && (
                    <p className="text-xs mt-1 px-1 flex items-center gap-1" style={{ color: '#22c55e' }}>Connected</p>
                  )}
                  {testResult === 'error' && (
                    <p className="text-xs mt-1 px-1" style={{ color: '#ef4444' }}>Connection failed</p>
                  )}
                </div>
              </>
            )}

            {provider === 'groq' && (
              <div className="mt-2 px-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                Uses cloud summarization
              </div>
            )}
          </div>

          <div className="h-px my-3" style={{ backgroundColor: 'var(--border)' }} />

          <div className="px-2">
            <div className="px-2 py-1.5 text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>APPEARANCE</div>
            <div 
              className="flex items-center justify-between px-3 py-3 rounded-md"
              style={{ backgroundColor: 'var(--surface-alt)' }}
            >
              <div className="text-sm" style={{ color: 'var(--text-primary)' }}>Theme</div>
              <select
                value={currentTheme}
                onChange={(e) => onThemeChange(e.target.value)}
                className="text-sm px-2 py-1 rounded"
                style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              >
                {themeList.map((theme) => (
                  <option key={theme.id} value={theme.id}>{theme.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="h-px my-3" style={{ backgroundColor: 'var(--border)' }} />

          <div className="px-2">
            <div className="px-2 py-1.5 text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>ACCOUNT</div>
            <button
              onClick={onSubscriptionOpen}
              className="w-full flex items-center justify-between px-3 py-3 rounded-md transition-colors"
              style={{ backgroundColor: 'var(--surface-alt)' }}
            >
              <div className="flex items-center gap-2">
                <Cloud size={16} style={{ color: subscription?.subscription_status === 'paid' ? '#22c55e' : subscription?.subscription_status === 'trial' ? '#f59e0b' : 'var(--text-secondary)' }} />
                <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                  {subscription?.subscription_status === 'paid' && 'Pro'}
                  {subscription?.subscription_status === 'trial' && `Trial: ${subscription.days_left}d`}
                  {subscription?.subscription_status === 'expired' && 'Expired'}
                  {!subscription?.subscription_status && 'Subscription'}
                </span>
              </div>
              <ChevronRight size={16} style={{ color: 'var(--text-tertiary)' }} />
            </button>
          </div>

          <div className="h-px my-3" style={{ backgroundColor: 'var(--border)' }} />

          <div className="px-2">
            <div className="px-2 py-1.5 text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>DATA</div>
            <button
              onClick={onExport}
              className="w-full flex items-center justify-between px-3 py-3 rounded-md transition-colors"
              style={{ backgroundColor: 'var(--surface-alt)' }}
            >
              <div className="flex items-center gap-2">
                <Download size={16} style={{ color: 'var(--text-secondary)' }} />
                <span className="text-sm" style={{ color: 'var(--text-primary)' }}>Export Notes</span>
              </div>
              <ChevronRight size={16} style={{ color: 'var(--text-tertiary)' }} />
            </button>
          </div>
        </div>

        <div className="p-3 shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
          <button
            onClick={onSignOut}
            className="w-full px-4 py-2.5 text-sm rounded-md flex items-center justify-center gap-2 transition-colors"
            style={{ backgroundColor: 'var(--surface-alt)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </div>
    </>
  )
}