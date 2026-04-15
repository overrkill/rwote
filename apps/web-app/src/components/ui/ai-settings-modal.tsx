'use client'

import { useState, useEffect } from 'react'
import type { AiSettings } from '@/lib/types'

interface AiSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  settings: AiSettings
  onSave: (settings: AiSettings) => void
}

export default function AiSettingsModal({ isOpen, onClose, settings, onSave }: AiSettingsModalProps) {
  const [provider, setProvider] = useState(settings.provider)
  const [ollamaUrl, setOllamaUrl] = useState(settings.ollamaUrl)
  const [ollamaModel, setOllamaModel] = useState(settings.ollamaModel)

  useEffect(() => {
    setProvider(settings.provider)
    setOllamaUrl(settings.ollamaUrl)
    setOllamaModel(settings.ollamaModel)
  }, [settings])

  if (!isOpen) return null

  const handleSave = () => {
    onSave({ provider, ollamaUrl, ollamaModel })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative rounded-lg shadow-xl w-full max-w-md" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>AI Settings</h2>
          <button
            onClick={onClose}
            className="p-1 rounded transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            ✕
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              AI Provider
            </label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as AiSettings['provider'])}
              className="w-full px-3 py-2 rounded-lg"
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
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Ollama URL
                </label>
                <input
                  type="text"
                  value={ollamaUrl}
                  onChange={(e) => setOllamaUrl(e.target.value)}
                  placeholder="http://localhost:11434"
                  className="w-full px-3 py-2 rounded-lg"
                  style={{ backgroundColor: 'var(--surface-alt)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Model
                </label>
                <input
                  type="text"
                  value={ollamaModel}
                  onChange={(e) => setOllamaModel(e.target.value)}
                  placeholder="llama3.2"
                  className="w-full px-3 py-2 rounded-lg"
                  style={{ backgroundColor: 'var(--surface-alt)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                />
                <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                  Make sure Ollama is running with: <code className="px-1 rounded" style={{ backgroundColor: 'var(--surface-alt)' }}>ollama serve</code>
                </p>
              </div>
            </>
          )}

          {provider === 'groq' && (
            <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
              <p className="text-sm" style={{ color: '#3b82f6' }}>
                Groq uses the cloud summarization service. Your text will be sent to our servers for AI processing.
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3 p-4" style={{ borderTop: '1px solid var(--border)' }}>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg cursor-pointer transition-colors"
            style={{ border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 rounded-lg cursor-pointer transition-opacity"
            style={{ backgroundColor: 'var(--accent-btn)', color: 'var(--bg)' }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
