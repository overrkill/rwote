export interface FontOption {
  key: string
  label: string
  cssStack: string
  googleFont?: string
}

export const EDITOR_FONTS: FontOption[] = [
  { key: 'system', label: 'System Default', cssStack: '-apple-system, BlinkMacSystemFont, \'Segoe UI\', \'Helvetica Neue\', sans-serif' },
  { key: 'jetbrains-mono', label: 'JetBrains Mono', cssStack: '\'JetBrains Mono\', \'Fira Code\', Menlo, Courier, monospace', googleFont: 'JetBrains Mono' },
  { key: 'fira-code', label: 'Fira Code', cssStack: '\'Fira Code\', \'JetBrains Mono\', Menlo, Courier, monospace', googleFont: 'Fira Code' },
  { key: 'source-code-pro', label: 'Source Code Pro', cssStack: '\'Source Code Pro\', Menlo, Courier, monospace', googleFont: 'Source Code Pro' },
  { key: 'dm-mono', label: 'DM Mono', cssStack: '\'DM Mono\', Menlo, Courier, monospace', googleFont: 'DM Mono' },
  { key: 'ibm-plex-mono', label: 'IBM Plex Mono', cssStack: '\'IBM Plex Mono\', Menlo, Courier, monospace', googleFont: 'IBM Plex Mono' },
  { key: 'inter', label: 'Inter', cssStack: '\'Inter\', system-ui, sans-serif', googleFont: 'Inter' },
  { key: 'dm-sans', label: 'DM Sans', cssStack: '\'DM Sans\', system-ui, sans-serif', googleFont: 'DM Sans' },
  { key: 'plus-jakarta-sans', label: 'Plus Jakarta Sans', cssStack: '\'Plus Jakarta Sans\', system-ui, sans-serif', googleFont: 'Plus Jakarta Sans' },
  { key: 'outfit', label: 'Outfit', cssStack: '\'Outfit\', system-ui, sans-serif', googleFont: 'Outfit' },
  { key: 'lora', label: 'Lora', cssStack: '\'Lora\', Georgia, serif', googleFont: 'Lora' },
  { key: 'source-serif-4', label: 'Source Serif 4', cssStack: '\'Source Serif 4\', Georgia, serif', googleFont: 'Source Serif 4' },
  { key: 'merriweather', label: 'Merriweather', cssStack: '\'Merriweather\', Georgia, serif', googleFont: 'Merriweather' },
  { key: 'pt-serif', label: 'PT Serif', cssStack: '\'PT Serif\', Georgia, serif', googleFont: 'PT Serif' },
  { key: 'dm-serif-display', label: 'DM Serif Display', cssStack: '\'DM Serif Display\', Georgia, serif', googleFont: 'DM Serif Display' },
]

export const INTERFACE_FONTS: FontOption[] = [
  { key: 'system', label: 'System Default', cssStack: '-apple-system, BlinkMacSystemFont, \'Segoe UI\', \'Helvetica Neue\', sans-serif' },
  { key: 'inter', label: 'Inter', cssStack: '\'Inter\', system-ui, sans-serif', googleFont: 'Inter' },
  { key: 'dm-sans', label: 'DM Sans', cssStack: '\'DM Sans\', system-ui, sans-serif', googleFont: 'DM Sans' },
  { key: 'plus-jakarta-sans', label: 'Plus Jakarta Sans', cssStack: '\'Plus Jakarta Sans\', system-ui, sans-serif', googleFont: 'Plus Jakarta Sans' },
  { key: 'outfit', label: 'Outfit', cssStack: '\'Outfit\', system-ui, sans-serif', googleFont: 'Outfit' },
  { key: 'lora', label: 'Lora', cssStack: '\'Lora\', Georgia, serif', googleFont: 'Lora' },
  { key: 'source-serif-4', label: 'Source Serif 4', cssStack: '\'Source Serif 4\', Georgia, serif', googleFont: 'Source Serif 4' },
  { key: 'merriweather', label: 'Merriweather', cssStack: '\'Merriweather\', Georgia, serif', googleFont: 'Merriweather' },
  { key: 'pt-serif', label: 'PT Serif', cssStack: '\'PT Serif\', Georgia, serif', googleFont: 'PT Serif' },
]

const FONT_MAP = new Map<string, FontOption>()
EDITOR_FONTS.forEach(f => FONT_MAP.set(f.key, f))
INTERFACE_FONTS.forEach(f => FONT_MAP.set(f.key, f))

export function getFontOption(key: string): FontOption | undefined {
  return FONT_MAP.get(key)
}

export function loadGoogleFont(family: string): void {
  if (typeof document === 'undefined') return
  const id = `gf-${family.replace(/\s+/g, '-').toLowerCase()}`
  if (document.getElementById(id)) return
  const link = document.createElement('link')
  link.id = id
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@400;500;600&display=swap`
  document.head.appendChild(link)
}
