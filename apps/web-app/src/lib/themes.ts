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
  monokai_light: {
    id: 'monokai_light',
    name: 'Monokai Pro',
    type: 'light',
    colors: {
      bg: '#faf8f5',
      surface: '#f2efe9',
      surfaceAlt: '#e8e4db',
      border: '#ccc9c0',
      borderFocus: '#45a5b7',
      textPrimary: '#403e3b',
      textSecondary: '#6e6c67',
      textTertiary: '#98968c',
      shadowSm: '0 1px 2px rgba(0,0,0,0.06)',
      shadowMd: '0 2px 6px rgba(0,0,0,0.1)',
      accent: '#45a5b7',
      accentBtn: '#45a5b7',
      cardMatchBorder: '#8644b0',
      markBg: '#f5f0e6',
      toastBg: '#403e3b',
      toastText: '#faf8f5',
      tagGeneral: '#ccc9c0',
      tagGeneralText: '#403e3b',
      tagArrays: '#45a5b7',
      tagArraysText: '#ffffff',
      tagStrings: '#5bbd42',
      tagStringsText: '#ffffff',
      tagSlidingWindow: '#d13823',
      tagSlidingWindowText: '#ffffff',
      tagPrefixSum: '#be840a',
      tagPrefixSumText: '#ffffff',
      tagHashing: '#8644b0',
      tagHashingText: '#ffffff',
      tagTrees: '#be840a',
      tagTreesText: '#ffffff',
      tagGraphs: '#45a5b7',
      tagGraphsText: '#ffffff',
      tagDp: '#d13823',
      tagDpText: '#ffffff',
      tagSorting: '#45a5b7',
      tagSortingText: '#ffffff',
      tagBacktracking: '#be840a',
      tagBacktrackingText: '#ffffff',
      tagBinarySearch: '#45a5b7',
      tagBinarySearchText: '#ffffff',
      tagHeaps: '#be840a',
      tagHeapsText: '#ffffff',
      tagTries: '#45a5b7',
      tagTriesText: '#ffffff',
    }
  },
  tokyonight_light: {
    id: 'tokyonight_light',
    name: 'Tokyo Night Light',
    type: 'light',
    colors: {
      bg: '#dfe2e8',
      surface: '#e8ebf2',
      surfaceAlt: '#ccd0da',
      border: '#a9b1d6',
      borderFocus: '#7aa2f7',
      textPrimary: '#1a1b26',
      textSecondary: '#4a5072',
      textTertiary: '#6b7194',
      shadowSm: '0 1px 2px rgba(0,0,0,0.1)',
      shadowMd: '0 2px 6px rgba(0,0,0,0.15)',
      accent: '#1d6e9c',
      accentBtn: '#1d6e9c',
      cardMatchBorder: '#7c3aed',
      markBg: '#fef3c7',
      toastBg: '#1a1b26',
      toastText: '#dfe2e8',
      tagGeneral: '#9aa5ce',
      tagGeneralText: '#1a1b26',
      tagArrays: '#1d6e9c',
      tagArraysText: '#ffffff',
      tagStrings: '#2f7d32',
      tagStringsText: '#ffffff',
      tagSlidingWindow: '#c23b70',
      tagSlidingWindowText: '#ffffff',
      tagPrefixSum: '#c05c18',
      tagPrefixSumText: '#ffffff',
      tagHashing: '#7c3aed',
      tagHashingText: '#ffffff',
      tagTrees: '#92690c',
      tagTreesText: '#ffffff',
      tagGraphs: '#0d7a5f',
      tagGraphsText: '#ffffff',
      tagDp: '#c23b70',
      tagDpText: '#ffffff',
      tagSorting: '#1d6e9c',
      tagSortingText: '#ffffff',
      tagBacktracking: '#92690c',
      tagBacktrackingText: '#ffffff',
      tagBinarySearch: '#1d6e9c',
      tagBinarySearchText: '#ffffff',
      tagHeaps: '#c05c18',
      tagHeapsText: '#ffffff',
      tagTries: '#0d7a5f',
      tagTriesText: '#ffffff',
    }
  },
  catppuccin_light: {
    id: 'catppuccin_light',
    name: 'Catppuccin Latte',
    type: 'light',
    colors: {
      bg: '#eff1f5',
      surface: '#e6e9ef',
      surfaceAlt: '#ccd0da',
      border: '#bcc5d4',
      borderFocus: '#8839ef',
      textPrimary: '#4c4f69',
      textSecondary: '#6c6f85',
      textTertiary: '#9ca0b0',
      shadowSm: '0 1px 2px rgba(0,0,0,0.08)',
      shadowMd: '0 2px 6px rgba(0,0,0,0.12)',
      accent: '#8839ef',
      accentBtn: '#8839ef',
      cardMatchBorder: '#d20f39',
      markBg: '#f5e0dc',
      toastBg: '#4c4f69',
      toastText: '#eff1f5',
      tagGeneral: '#9ca0b0',
      tagGeneralText: '#4c4f69',
      tagArrays: '#04a5e5',
      tagArraysText: '#ffffff',
      tagStrings: '#40a02b',
      tagStringsText: '#ffffff',
      tagSlidingWindow: '#d20f39',
      tagSlidingWindowText: '#ffffff',
      tagPrefixSum: '#fe640b',
      tagPrefixSumText: '#ffffff',
      tagHashing: '#8839ef',
      tagHashingText: '#ffffff',
      tagTrees: '#df8e1d',
      tagTreesText: '#ffffff',
      tagGraphs: '#179299',
      tagGraphsText: '#ffffff',
      tagDp: '#d20f39',
      tagDpText: '#ffffff',
      tagSorting: '#04a5e5',
      tagSortingText: '#ffffff',
      tagBacktracking: '#df8e1d',
      tagBacktrackingText: '#ffffff',
      tagBinarySearch: '#04a5e5',
      tagBinarySearchText: '#ffffff',
      tagHeaps: '#fe640b',
      tagHeapsText: '#ffffff',
      tagTries: '#179299',
      tagTriesText: '#ffffff',
    }
  },
  nord_light: {
    id: 'nord_light',
    name: 'Nord Frost',
    type: 'light',
    colors: {
      bg: '#e5e9f0',
      surface: '#eceff4',
      surfaceAlt: '#d8dee9',
      border: '#c4c9d4',
      borderFocus: '#5e81ac',
      textPrimary: '#2e3440',
      textSecondary: '#4c566a',
      textTertiary: '#6b7494',
      shadowSm: '0 1px 2px rgba(0,0,0,0.08)',
      shadowMd: '0 2px 6px rgba(0,0,0,0.12)',
      accent: '#5e81ac',
      accentBtn: '#5e81ac',
      cardMatchBorder: '#4c566a',
      markBg: '#e5e9f0',
      toastBg: '#2e3440',
      toastText: '#eceff4',
      tagGeneral: '#c4c9d4',
      tagGeneralText: '#2e3440',
      tagArrays: '#5e81ac',
      tagArraysText: '#ffffff',
      tagStrings: '#a3be8c',
      tagStringsText: '#2e3440',
      tagSlidingWindow: '#bf616a',
      tagSlidingWindowText: '#ffffff',
      tagPrefixSum: '#ebcb8b',
      tagPrefixSumText: '#2e3440',
      tagHashing: '#b48ead',
      tagHashingText: '#2e3440',
      tagTrees: '#ebcb8b',
      tagTreesText: '#2e3440',
      tagGraphs: '#8fbcbb',
      tagGraphsText: '#2e3440',
      tagDp: '#bf616a',
      tagDpText: '#ffffff',
      tagSorting: '#81a1c1',
      tagSortingText: '#2e3440',
      tagBacktracking: '#ebcb8b',
      tagBacktrackingText: '#2e3440',
      tagBinarySearch: '#5e81ac',
      tagBinarySearchText: '#ffffff',
      tagHeaps: '#d08770',
      tagHeapsText: '#2e3440',
      tagTries: '#8fbcbb',
      tagTriesText: '#2e3440',
    }
  },
  ayu: {
    id: 'ayu',
    name: 'Ayu Dark',
    type: 'dark',
    colors: {
      bg: '#0f0e0d',
      surface: '#171614',
      surfaceAlt: '#252422',
      border: '#3d3b36',
      borderFocus: '#ff6b6b',
      textPrimary: '#f8f4e3',
      textSecondary: '#b9b39a',
      textTertiary: '#786e64',
      shadowSm: '0 1px 2px rgba(0,0,0,0.3)',
      shadowMd: '0 2px 6px rgba(0,0,0,0.4)',
      accent: '#ff6b6b',
      accentBtn: '#ff6b6b',
      cardMatchBorder: '#f07178',
      markBg: '#4d3d2a',
      toastBg: '#f8f4e3',
      toastText: '#0f0e0d',
      tagGeneral: '#3d3b36',
      tagGeneralText: '#f8f4e3',
      tagArrays: '#f07178',
      tagArraysText: '#0f0e0d',
      tagStrings: '#f2c45f',
      tagStringsText: '#0f0e0d',
      tagSlidingWindow: '#ff6b6b',
      tagSlidingWindowText: '#0f0e0d',
      tagPrefixSum: '#ffb36b',
      tagPrefixSumText: '#0f0e0d',
      tagHashing: '#d5a8e4',
      tagHashingText: '#0f0e0d',
      tagTrees: '#ffe066',
      tagTreesText: '#0f0e0d',
      tagGraphs: '#5cd4d4',
      tagGraphsText: '#0f0e0d',
      tagDp: '#ff6b6b',
      tagDpText: '#0f0e0d',
      tagSorting: '#f07178',
      tagSortingText: '#0f0e0d',
      tagBacktracking: '#ffe066',
      tagBacktrackingText: '#0f0e0d',
      tagBinarySearch: '#f07178',
      tagBinarySearchText: '#0f0e0d',
      tagHeaps: '#ffb36b',
      tagHeapsText: '#0f0e0d',
      tagTries: '#5cd4d4',
      tagTriesText: '#0f0e0d',
    }
  },
  ayu_light: {
    id: 'ayu_light',
    name: 'Ayu Mirage',
    type: 'light',
    colors: {
      bg: '#f3f1eb',
      surface: '#faf8f5',
      surfaceAlt: '#e6e2d9',
      border: '#d4ceb8',
      borderFocus: '#f07178',
      textPrimary: '#5c5b4f',
      textSecondary: '#8a8475',
      textTertiary: '#a69e8e',
      shadowSm: '0 1px 2px rgba(0,0,0,0.06)',
      shadowMd: '0 2px 6px rgba(0,0,0,0.1)',
      accent: '#f07178',
      accentBtn: '#f07178',
      cardMatchBorder: '#a74f4f',
      markBg: '#f9f5eb',
      toastBg: '#5c5b4f',
      toastText: '#f3f1eb',
      tagGeneral: '#d4ceb8',
      tagGeneralText: '#5c5b4f',
      tagArrays: '#a74f4f',
      tagArraysText: '#ffffff',
      tagStrings: '#6d5d1e',
      tagStringsText: '#ffffff',
      tagSlidingWindow: '#c92c2c',
      tagSlidingWindowText: '#ffffff',
      tagPrefixSum: '#c9790c',
      tagPrefixSumText: '#ffffff',
      tagHashing: '#9141ac',
      tagHashingText: '#ffffff',
      tagTrees: '#a78b1a',
      tagTreesText: '#ffffff',
      tagGraphs: '#1e7a7a',
      tagGraphsText: '#ffffff',
      tagDp: '#c92c2c',
      tagDpText: '#ffffff',
      tagSorting: '#a74f4f',
      tagSortingText: '#ffffff',
      tagBacktracking: '#a78b1a',
      tagBacktrackingText: '#ffffff',
      tagBinarySearch: '#a74f4f',
      tagBinarySearchText: '#ffffff',
      tagHeaps: '#c9790c',
      tagHeapsText: '#ffffff',
      tagTries: '#1e7a7a',
      tagTriesText: '#ffffff',
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
