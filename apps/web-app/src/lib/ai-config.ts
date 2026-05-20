import type { AiAnalyzeConfig } from './types'

const STORAGE_KEY = 'rwote_analyze_ai_config'

export const DEFAULT_ANALYZE_CONFIG: AiAnalyzeConfig = {
  provider: 'openai',
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-4o-mini',
  apiKey: '',
}

export function loadAnalyzeConfig(): AiAnalyzeConfig {
  if (typeof window === 'undefined') return DEFAULT_ANALYZE_CONFIG
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_ANALYZE_CONFIG
    const parsed = JSON.parse(raw)
    return { ...DEFAULT_ANALYZE_CONFIG, ...parsed }
  } catch {
    return DEFAULT_ANALYZE_CONFIG
  }
}

export function saveAnalyzeConfig(config: AiAnalyzeConfig): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
}
