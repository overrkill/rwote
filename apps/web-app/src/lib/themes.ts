export interface ThemeColors {
  bg: string
  surface: string
  surfaceAlt: string
  border: string
  borderFocus: string
  textPrimary: string
  textSecondary: string
  textTertiary: string
  shadowSm: string
  shadowMd: string
  accent: string
  accentBtn: string
  cardMatchBorder: string
  markBg: string
  toastBg: string
  toastText: string
  tagGeneral: string
  tagGeneralText: string
  tagArrays: string
  tagArraysText: string
  tagStrings: string
  tagStringsText: string
  tagSlidingWindow: string
  tagSlidingWindowText: string
  tagPrefixSum: string
  tagPrefixSumText: string
  tagHashing: string
  tagHashingText: string
  tagTrees: string
  tagTreesText: string
  tagGraphs: string
  tagGraphsText: string
  tagDp: string
  tagDpText: string
  tagSorting: string
  tagSortingText: string
  tagBacktracking: string
  tagBacktrackingText: string
  tagBinarySearch: string
  tagBinarySearchText: string
  tagHeaps: string
  tagHeapsText: string
  tagTries: string
  tagTriesText: string
}

export interface Theme {
  id: string
  name: string
  type: 'dark' | 'light'
  colors: ThemeColors
}

export const THEMES: Record<string, Theme> = {
  paper_dark: {
    id: 'paper_dark',
    name: 'Paper Dark',
    type: 'dark',
    colors: {
      bg: '#1a1a1e',
      surface: '#242428',
      surfaceAlt: '#2e2e34',
      border: '#3a3a40',
      borderFocus: '#505058',
      textPrimary: '#f5f2ec',
      textSecondary: '#a0a0a0',
      textTertiary: '#686868',
      shadowSm: '0 1px 2px rgba(0,0,0,0.25)',
      shadowMd: '0 2px 6px rgba(0,0,0,0.35)',
      accent: '#a0a0a0',
      accentBtn: '#f5f2ec',
      cardMatchBorder: '#4090b0',
      markBg: '#5a4820',
      toastBg: '#e8e8e8',
      toastText: '#1a1a1a',
      tagGeneral: '#3a3a3a',
      tagGeneralText: '#c8c8c8',
      tagArrays: '#1e3a5f',
      tagArraysText: '#7ab8e8',
      tagStrings: '#1e3f1e',
      tagStringsText: '#7ac87a',
      tagSlidingWindow: '#5f1e3f',
      tagSlidingWindowText: '#e87ab8',
      tagPrefixSum: '#5f3f1e',
      tagPrefixSumText: '#e8b87a',
      tagHashing: '#2e2e5f',
      tagHashingText: '#a87ae8',
      tagTrees: '#5f4f1e',
      tagTreesText: '#e8c87a',
      tagGraphs: '#1e4f3f',
      tagGraphsText: '#7ae8c8',
      tagDp: '#5f1e1e',
      tagDpText: '#e87a7a',
      tagSorting: '#1e2e5f',
      tagSortingText: '#7a8ae8',
      tagBacktracking: '#4f3f1e',
      tagBacktrackingText: '#c8b87a',
      tagBinarySearch: '#1e3f5f',
      tagBinarySearchText: '#7ab8e8',
      tagHeaps: '#5f1e3f',
      tagHeapsText: '#e87aa8',
      tagTries: '#1e4f4f',
      tagTriesText: '#7ae8d8',
    }
  },
  tokyonight: {
    id: 'tokyonight',
    name: 'Tokyo Night',
    type: 'dark',
    colors: {
      bg: '#1a1b26',
      surface: '#16161e',
      surfaceAlt: '#24283b',
      border: '#414868',
      borderFocus: '#7aa2f7',
      textPrimary: '#c0caf5',
      textSecondary: '#9aa5ce',
      textTertiary: '#565f89',
      shadowSm: '0 1px 2px rgba(0,0,0,0.3)',
      shadowMd: '0 2px 6px rgba(0,0,0,0.4)',
      accent: '#7aa2f7',
      accentBtn: '#7aa2f7',
      cardMatchBorder: '#bb9af7',
      markBg: '#3d3a50',
      toastBg: '#c0caf5',
      toastText: '#1a1b26',
      tagGeneral: '#414868',
      tagGeneralText: '#c0caf5',
      tagArrays: '#7aa2f7',
      tagArraysText: '#1a1b26',
      tagStrings: '#9ece6a',
      tagStringsText: '#1a1b26',
      tagSlidingWindow: '#f7768e',
      tagSlidingWindowText: '#1a1b26',
      tagPrefixSum: '#ff9e64',
      tagPrefixSumText: '#1a1b26',
      tagHashing: '#bb9af7',
      tagHashingText: '#1a1b26',
      tagTrees: '#e0af68',
      tagTreesText: '#1a1b26',
      tagGraphs: '#73daca',
      tagGraphsText: '#1a1b26',
      tagDp: '#f7768e',
      tagDpText: '#1a1b26',
      tagSorting: '#7aa2f7',
      tagSortingText: '#1a1b26',
      tagBacktracking: '#e0af68',
      tagBacktrackingText: '#1a1b26',
      tagBinarySearch: '#7aa2f7',
      tagBinarySearchText: '#1a1b26',
      tagHeaps: '#ff9e64',
      tagHeapsText: '#1a1b26',
      tagTries: '#73daca',
      tagTriesText: '#1a1b26',
    }
  },
  catppuccin: {
    id: 'catppuccin',
    name: 'Catppuccin',
    type: 'dark',
    colors: {
      bg: '#1e1e2e',
      surface: '#181825',
      surfaceAlt: '#313244',
      border: '#45475a',
      borderFocus: '#cba6f7',
      textPrimary: '#cdd6f4',
      textSecondary: '#bac2de',
      textTertiary: '#6c7086',
      shadowSm: '0 1px 2px rgba(0,0,0,0.3)',
      shadowMd: '0 2px 6px rgba(0,0,0,0.4)',
      accent: '#cba6f7',
      accentBtn: '#cba6f7',
      cardMatchBorder: '#f38ba8',
      markBg: '#4a4063',
      toastBg: '#cdd6f4',
      toastText: '#1e1e2e',
      tagGeneral: '#45475a',
      tagGeneralText: '#cdd6f4',
      tagArrays: '#89b4fa',
      tagArraysText: '#1e1e2e',
      tagStrings: '#a6e3a1',
      tagStringsText: '#1e1e2e',
      tagSlidingWindow: '#f38ba8',
      tagSlidingWindowText: '#1e1e2e',
      tagPrefixSum: '#fab387',
      tagPrefixSumText: '#1e1e2e',
      tagHashing: '#cba6f7',
      tagHashingText: '#1e1e2e',
      tagTrees: '#f9e2af',
      tagTreesText: '#1e1e2e',
      tagGraphs: '#94e2d5',
      tagGraphsText: '#1e1e2e',
      tagDp: '#f38ba8',
      tagDpText: '#1e1e2e',
      tagSorting: '#89b4fa',
      tagSortingText: '#1e1e2e',
      tagBacktracking: '#f9e2af',
      tagBacktrackingText: '#1e1e2e',
      tagBinarySearch: '#89b4fa',
      tagBinarySearchText: '#1e1e2e',
      tagHeaps: '#fab387',
      tagHeapsText: '#1e1e2e',
      tagTries: '#94e2d5',
      tagTriesText: '#1e1e2e',
    }
  },
  nord: {
    id: 'nord',
    name: 'Nord',
    type: 'dark',
    colors: {
      bg: '#2e3440',
      surface: '#3b4252',
      surfaceAlt: '#434c5e',
      border: '#4c566a',
      borderFocus: '#88c0d0',
      textPrimary: '#eceff4',
      textSecondary: '#d8dee9',
      textTertiary: '#8692a5',
      shadowSm: '0 1px 2px rgba(0,0,0,0.25)',
      shadowMd: '0 2px 6px rgba(0,0,0,0.35)',
      accent: '#88c0d0',
      accentBtn: '#88c0d0',
      cardMatchBorder: '#81a1c1',
      markBg: '#4c566a',
      toastBg: '#eceff4',
      toastText: '#2e3440',
      tagGeneral: '#4c566a',
      tagGeneralText: '#eceff4',
      tagArrays: '#88c0d0',
      tagArraysText: '#2e3440',
      tagStrings: '#a3be8c',
      tagStringsText: '#2e3440',
      tagSlidingWindow: '#bf616a',
      tagSlidingWindowText: '#2e3440',
      tagPrefixSum: '#ebcb8b',
      tagPrefixSumText: '#2e3440',
      tagHashing: '#b48ead',
      tagHashingText: '#2e3440',
      tagTrees: '#ebcb8b',
      tagTreesText: '#2e3440',
      tagGraphs: '#8fbcbb',
      tagGraphsText: '#2e3440',
      tagDp: '#bf616a',
      tagDpText: '#2e3440',
      tagSorting: '#81a1c1',
      tagSortingText: '#2e3440',
      tagBacktracking: '#ebcb8b',
      tagBacktrackingText: '#2e3440',
      tagBinarySearch: '#88c0d0',
      tagBinarySearchText: '#2e3440',
      tagHeaps: '#d08770',
      tagHeapsText: '#2e3440',
      tagTries: '#8fbcbb',
      tagTriesText: '#2e3440',
    }
  },
  monokai: {
    id: 'monokai',
    name: 'Monokai',
    type: 'dark',
    colors: {
      bg: '#272822',
      surface: '#1e1f1c',
      surfaceAlt: '#3e3d32',
      border: '#49483e',
      borderFocus: '#66d9e8',
      textPrimary: '#f8f8f2',
      textSecondary: '#cfcfc2',
      textTertiary: '#75715e',
      shadowSm: '0 1px 2px rgba(0,0,0,0.3)',
      shadowMd: '0 2px 6px rgba(0,0,0,0.4)',
      accent: '#66d9e8',
      accentBtn: '#66d9e8',
      cardMatchBorder: '#ae81ff',
      markBg: '#4e4a32',
      toastBg: '#f8f8f2',
      toastText: '#272822',
      tagGeneral: '#49483e',
      tagGeneralText: '#f8f8f2',
      tagArrays: '#66d9e8',
      tagArraysText: '#272822',
      tagStrings: '#a6e22e',
      tagStringsText: '#272822',
      tagSlidingWindow: '#f92672',
      tagSlidingWindowText: '#272822',
      tagPrefixSum: '#e6db74',
      tagPrefixSumText: '#272822',
      tagHashing: '#ae81ff',
      tagHashingText: '#272822',
      tagTrees: '#e6db74',
      tagTreesText: '#272822',
      tagGraphs: '#ae81ff',
      tagGraphsText: '#272822',
      tagDp: '#f92672',
      tagDpText: '#272822',
      tagSorting: '#66d9e8',
      tagSortingText: '#272822',
      tagBacktracking: '#e6db74',
      tagBacktrackingText: '#272822',
      tagBinarySearch: '#66d9e8',
      tagBinarySearchText: '#272822',
      tagHeaps: '#fd971f',
      tagHeapsText: '#272822',
      tagTries: '#ae81ff',
      tagTriesText: '#272822',
    }
  },
  light: {
    id: 'light',
    name: 'Light',
    type: 'light',
    colors: {
      bg: '#ffffff',
      surface: '#fafafa',
      surfaceAlt: '#f0f0f0',
      border: '#d8d8d8',
      borderFocus: '#a0a0a0',
      textPrimary: '#1a1a1a',
      textSecondary: '#555555',
      textTertiary: '#888888',
      shadowSm: '0 1px 2px rgba(0,0,0,0.06)',
      shadowMd: '0 2px 6px rgba(0,0,0,0.1)',
      accent: '#a0a0a0',
      accentBtn: '#1a1a1a',
      cardMatchBorder: '#4090b0',
      markBg: '#ffeab4',
      toastBg: '#1a1a1a',
      toastText: '#ffffff',
      tagGeneral: '#e8e8e8',
      tagGeneralText: '#4a4a4a',
      tagArrays: '#d0e8f4',
      tagArraysText: '#2563a0',
      tagStrings: '#c8e6c8',
      tagStringsText: '#2e7d32',
      tagSlidingWindow: '#f4c4d8',
      tagSlidingWindowText: '#a02060',
      tagPrefixSum: '#f4dcc4',
      tagPrefixSumText: '#a05020',
      tagHashing: '#dcd8f4',
      tagHashingText: '#4a2da0',
      tagTrees: '#f4e4c4',
      tagTreesText: '#7a5010',
      tagGraphs: '#c4e8dc',
      tagGraphsText: '#1a5a40',
      tagDp: '#f4d4d4',
      tagDpText: '#a02020',
      tagSorting: '#d4dcf4',
      tagSortingText: '#2a4aa0',
      tagBacktracking: '#e4e0d4',
      tagBacktrackingText: '#5a4820',
      tagBinarySearch: '#d4e0f4',
      tagBinarySearchText: '#2a5090',
      tagHeaps: '#f4d4e4',
      tagHeapsText: '#802060',
      tagTries: '#c4f4e8',
      tagTriesText: '#1a6858',
    }
  }
}

export const THEME_IDS = Object.keys(THEMES)

export function getTheme(id: string): Theme {
  return THEMES[id] || THEMES.paper_dark
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement
  const c = theme.colors
  
  root.style.setProperty('--bg', c.bg)
  root.style.setProperty('--surface', c.surface)
  root.style.setProperty('--surface-alt', c.surfaceAlt)
  root.style.setProperty('--border', c.border)
  root.style.setProperty('--border-focus', c.borderFocus)
  root.style.setProperty('--text-primary', c.textPrimary)
  root.style.setProperty('--text-secondary', c.textSecondary)
  root.style.setProperty('--text-tertiary', c.textTertiary)
  root.style.setProperty('--shadow-sm', c.shadowSm)
  root.style.setProperty('--shadow-md', c.shadowMd)
  root.style.setProperty('--accent', c.accent)
  root.style.setProperty('--accent-btn', c.accentBtn)
  root.style.setProperty('--card-match-border', c.cardMatchBorder)
  root.style.setProperty('--mark-bg', c.markBg)
  root.style.setProperty('--toast-bg', c.toastBg)
  root.style.setProperty('--toast-text', c.toastText)
  
  // Tags
  root.style.setProperty('--tag-general', c.tagGeneral)
  root.style.setProperty('--tag-general-text', c.tagGeneralText)
  root.style.setProperty('--tag-arrays', c.tagArrays)
  root.style.setProperty('--tag-arrays-text', c.tagArraysText)
  root.style.setProperty('--tag-strings', c.tagStrings)
  root.style.setProperty('--tag-strings-text', c.tagStringsText)
  root.style.setProperty('--tag-sliding-window', c.tagSlidingWindow)
  root.style.setProperty('--tag-sliding-window-text', c.tagSlidingWindowText)
  root.style.setProperty('--tag-prefix-sum', c.tagPrefixSum)
  root.style.setProperty('--tag-prefix-sum-text', c.tagPrefixSumText)
  root.style.setProperty('--tag-hashing', c.tagHashing)
  root.style.setProperty('--tag-hashing-text', c.tagHashingText)
  root.style.setProperty('--tag-trees', c.tagTrees)
  root.style.setProperty('--tag-trees-text', c.tagTreesText)
  root.style.setProperty('--tag-graphs', c.tagGraphs)
  root.style.setProperty('--tag-graphs-text', c.tagGraphsText)
  root.style.setProperty('--tag-dp', c.tagDp)
  root.style.setProperty('--tag-dp-text', c.tagDpText)
  root.style.setProperty('--tag-sorting', c.tagSorting)
  root.style.setProperty('--tag-sorting-text', c.tagSortingText)
  root.style.setProperty('--tag-backtracking', c.tagBacktracking)
  root.style.setProperty('--tag-backtracking-text', c.tagBacktrackingText)
  root.style.setProperty('--tag-binary-search', c.tagBinarySearch)
  root.style.setProperty('--tag-binary-search-text', c.tagBinarySearchText)
  root.style.setProperty('--tag-heaps', c.tagHeaps)
  root.style.setProperty('--tag-heaps-text', c.tagHeapsText)
  root.style.setProperty('--tag-tries', c.tagTries)
  root.style.setProperty('--tag-tries-text', c.tagTriesText)
  
  // Set dark class for Tailwind dark mode compatibility
  if (theme.type === 'dark') {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}
