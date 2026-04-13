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
      <div className="relative bg-white dark:bg-[#2a2a28] rounded-lg shadow-xl w-full max-w-md border border-border-light dark:border-border-dark">
        <div className="flex items-center justify-between p-4 border-b border-border-light dark:border-border-dark">
          <h2 className="text-lg font-semibold text-primary-light dark:text-primary-dark">AI Settings</h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary-light dark:text-primary-dark mb-2">
              AI Provider
            </label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as AiSettings['provider'])}
              className="w-full px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-primary-light dark:text-primary-dark"
            >
              <option value="disabled">Disabled</option>
              <option value="ollama">Ollama (Local)</option>
              <option value="groq">Groq (Cloud)</option>
            </select>
          </div>

          {provider === 'ollama' && (
            <>
              <div>
                <label className="block text-sm font-medium text-primary-light dark:text-primary-dark mb-2">
                  Ollama URL
                </label>
                <input
                  type="text"
                  value={ollamaUrl}
                  onChange={(e) => setOllamaUrl(e.target.value)}
                  placeholder="http://localhost:11434"
                  className="w-full px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-primary-light dark:text-primary-dark"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-light dark:text-primary-dark mb-2">
                  Model
                </label>
                <input
                  type="text"
                  value={ollamaModel}
                  onChange={(e) => setOllamaModel(e.target.value)}
                  placeholder="llama3.2"
                  className="w-full px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-primary-light dark:text-primary-dark"
                />
                <p className="text-xs text-secondary-light dark:text-secondary-dark mt-1">
                  Make sure Ollama is running with: <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">ollama serve</code>
                </p>
              </div>
            </>
          )}

          {provider === 'groq' && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                Groq uses the cloud summarization service. Your text will be sent to our servers for AI processing.
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3 p-4 border-t border-border-light dark:border-border-dark">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg border border-border-light dark:border-border-dark text-primary-light dark:text-primary-dark hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 rounded-lg bg-primary-light dark:bg-primary-dark text-white hover:opacity-90 transition-opacity"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
