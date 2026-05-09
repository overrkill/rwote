'use client'

import { useState } from 'react'
import { X, Cloud, Sun, Download, LogOut, Check, Loader2 } from 'lucide-react'
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

  if (!isOpen) return null

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/30"
        onClick={onClose}
        style={{ backdropFilter: 'blur(2px)' }}
      />
      <div
        className="fixed top-0 right-0 h-full w-full max-w-md z-50 flex flex-col transition-transform duration-300 ease-out shadow-2xl overflow-y-auto"
        style={{ backgroundColor: 'var(--surface)', borderLeft: '1px solid var(--border)' }}
      >
        <div className="p-4 flex items-center justify-between shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Settings</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-md transition-colors hover:bg-black/10"
            style={{ color: 'var(--text-secondary)' }}
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        <div className="p-4 flex-1 space-y-6">
          <section>
            <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>AI</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs mb-1.5" style={{ color: 'var(--text-primary)' }}>Provider</label>
                <select
                  value={provider}
                  onChange={(e) => {
                    setProvider(e.target.value as AiSettings['provider'])
                    setTimeout(handleSave, 0)
                  }}
                  className="w-full px-3 py-2 rounded-md text-sm"
                  style={{ backgroundColor: 'var(--surface-alt)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                >
                  <option value="disabled">Disabled</option>
                  <option value="ollama">Ollama (Local)</option>
                  <option value="groq">Groq (Cloud)</option>
                </select>
              </div>

              {provider === 'ollama' && (
                <>
                  <div>
                    <label className="block text-xs mb-1.5" style={{ color: 'var(--text-primary)' }}>URL</label>
                    <input
                      type="text"
                      value={ollamaUrl}
                      onChange={(e) => setOllamaUrl(e.target.value)}
                      onBlur={handleSave}
                      placeholder="http://localhost:11434"
                      className="w-full px-3 py-2 rounded-md text-sm"
                      style={{ backgroundColor: 'var(--surface-alt)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs mb-1.5" style={{ color: 'var(--text-primary)' }}>Model</label>
                    <input
                      type="text"
                      value={ollamaModel}
                      onChange={(e) => setOllamaModel(e.target.value)}
                      onBlur={handleSave}
                      placeholder="llama3.2"
                      className="w-full px-3 py-2 rounded-md text-sm"
                      style={{ backgroundColor: 'var(--surface-alt)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    />
                  </div>
                  <button
                    onClick={handleTestConnection}
                    disabled={testing}
                    className="px-3 py-1.5 text-xs rounded-md flex items-center gap-2 transition-colors disabled:opacity-50"
                    style={{ backgroundColor: 'var(--surface-alt)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                  >
                    {testing ? <Loader2 size={12} className="animate-spin" /> : null}
                    Test Connection
                  </button>
                  {testResult === 'success' && (
                    <p className="text-xs flex items-center gap-1" style={{ color: '#22c55e' }}>
                      <Check size={12} /> Connected
                    </p>
                  )}
                  {testResult === 'error' && (
                    <p className="text-xs" style={{ color: '#ef4444' }}>
                      Connection failed. Make sure Ollama is running.
                    </p>
                  )}
                </>
              )}

              {provider === 'groq' && (
                <p className="text-xs p-2 rounded" style={{ backgroundColor: 'var(--surface-alt)', color: 'var(--text-secondary)' }}>
                  Uses cloud summarization. Text sent to servers for processing.
                </p>
              )}
            </div>
          </section>

          <section>
            <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>Appearance</h3>
            <div className="grid grid-cols-2 gap-2">
              {themeList.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => onThemeChange(theme.id)}
                  className="px-3 py-2 text-sm rounded-md text-left transition-colors"
                  style={{
                    backgroundColor: currentTheme === theme.id ? 'var(--surface-alt)' : 'transparent',
                    color: 'var(--text-primary)',
                    border: currentTheme === theme.id ? '2px solid var(--accent)' : '1px solid var(--border)',
                    fontWeight: currentTheme === theme.id ? 500 : 400,
                  }}
                >
                  {theme.name}
                </button>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>Account</h3>
            <div className="space-y-3">
              <div className="p-3 rounded-md" style={{ backgroundColor: 'var(--surface-alt)' }}>
                <div className="flex items-center gap-3 mb-2">
                  <Avatar user={user} size={32} />
                  <div>
                    <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{user?.name || 'User'}</div>
                    <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{user?.email}</div>
                  </div>
                </div>
                <button
                  onClick={onSubscriptionOpen}
                  className="w-full mt-2 px-3 py-2 text-sm rounded-md flex items-center justify-center gap-2 transition-colors"
                  style={{
                    backgroundColor: subscription?.subscription_status === 'paid' ? '#22c55e' : 
                                   subscription?.subscription_status === 'trial' ? '#f59e0b' : 
                                   subscription?.subscription_status === 'expired' ? '#ef4444' : 'var(--accent-btn)',
                    color: 'white',
                  }}
                >
                  <Cloud size={14} />
                  {subscription?.subscription_status === 'paid' && 'Pro'}
                  {subscription?.subscription_status === 'trial' && `Trial: ${subscription.days_left}d left`}
                  {subscription?.subscription_status === 'expired' && 'Expired'}
                  {(subscription?.subscription_status === 'trial' || subscription?.subscription_status === 'expired') && ' - Upgrade'}
                </button>
              </div>
              <button
                onClick={onSignOut}
                className="w-full px-4 py-2 text-sm rounded-md flex items-center justify-center gap-2 transition-colors"
                style={{ backgroundColor: 'var(--surface-alt)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
              >
                <LogOut size={14} />
                Sign Out
              </button>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>Data</h3>
            <button
              onClick={onExport}
              className="w-full px-4 py-2 text-sm rounded-md flex items-center justify-center gap-2 transition-colors"
              style={{ backgroundColor: 'var(--surface-alt)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
            >
              <Download size={14} />
              Export Notes
            </button>
          </section>
        </div>
      </div>
    </>
  )
}