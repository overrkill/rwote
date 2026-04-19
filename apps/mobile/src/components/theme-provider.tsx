'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';

const CACHE: Record<string, string> = {};

export interface ThemeSpacing {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
}

export interface ThemeColors {
  bg: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  borderFocus: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  accent: string;
  accentBtn: string;
}

export interface Theme {
  id: string;
  name: string;
  type: 'dark' | 'light';
  colors: ThemeColors;
  spacing: ThemeSpacing;
}

export interface ThemeContextType {
  theme: Theme;
  themeId: string;
  setThemeId: (id: string) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeIdState] = useState('paper_dark');

  useEffect(() => {
    SecureStore.getItemAsync('theme_id').then((value) => {
      if (value) {
        setThemeIdState(value);
      }
    }).catch(() => {});
  }, []);

  const setThemeId = async (newId: string) => {
    setThemeIdState(newId);
    CACHE['theme_id'] = newId;
    await SecureStore.setItemAsync('theme_id', newId);
  };

  const theme = THEMES[themeId] || THEMES.paper_dark;
  const isDark = theme.type === 'dark';

  return (
    <ThemeContext.Provider value={{ theme, themeId, setThemeId, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

const SPACING: ThemeSpacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const THEMES: Record<string, Theme> = {
  paper_dark: {
    id: 'paper_dark',
    name: 'Paper Dark',
    type: 'dark',
    spacing: SPACING,
    colors: {
      bg: '#1a1a1e',
      surface: '#242428',
      surfaceAlt: '#2e2e34',
      border: '#3a3a40',
      borderFocus: '#505058',
      textPrimary: '#f5f2ec',
      textSecondary: '#a0a0a0',
      textTertiary: '#686868',
      accent: '#a0a0a0',
      accentBtn: '#f5f2ec',
    },
  },
  tokyonight: {
    id: 'tokyonight',
    name: 'Tokyo Night',
    type: 'dark',
    spacing: SPACING,
    colors: {
      bg: '#1a1b26',
      surface: '#16161e',
      surfaceAlt: '#24283b',
      border: '#414868',
      borderFocus: '#7aa2f7',
      textPrimary: '#c0caf5',
      textSecondary: '#9aa5ce',
      textTertiary: '#565f89',
      accent: '#7aa2f7',
      accentBtn: '#7aa2f7',
    },
  },
  tokyonight_light: {
    id: 'tokyonight_light',
    name: 'Tokyo Night Light',
    type: 'light',
    spacing: SPACING,
    colors: {
      bg: '#dfe2e8',
      surface: '#e8ebf2',
      surfaceAlt: '#ccd0da',
      border: '#a9b1d6',
      borderFocus: '#7aa2f7',
      textPrimary: '#1a1b26',
      textSecondary: '#4a5072',
      textTertiary: '#6b7194',
      accent: '#1d6e9c',
      accentBtn: '#1d6e9c',
    },
  },
  catppuccin: {
    id: 'catppuccin',
    name: 'Catppuccin',
    type: 'dark',
    spacing: SPACING,
    colors: {
      bg: '#1e1e2e',
      surface: '#181825',
      surfaceAlt: '#313244',
      border: '#45475a',
      borderFocus: '#cba6f7',
      textPrimary: '#cdd6f4',
      textSecondary: '#bac2de',
      textTertiary: '#6c7086',
      accent: '#cba6f7',
      accentBtn: '#cba6f7',
    },
  },
  catppuccin_light: {
    id: 'catppuccin_light',
    name: 'Catppuccin Latte',
    type: 'light',
    spacing: SPACING,
    colors: {
      bg: '#eff1f5',
      surface: '#e6e9ef',
      surfaceAlt: '#ccd0da',
      border: '#bcc5d4',
      borderFocus: '#8839ef',
      textPrimary: '#4c4f69',
      textSecondary: '#6c6f85',
      textTertiary: '#9ca0b0',
      accent: '#8839ef',
      accentBtn: '#8839ef',
    },
  },
  nord: {
    id: 'nord',
    name: 'Nord',
    type: 'dark',
    spacing: SPACING,
    colors: {
      bg: '#2e3440',
      surface: '#3b4252',
      surfaceAlt: '#434c5e',
      border: '#4c566a',
      borderFocus: '#88c0d0',
      textPrimary: '#eceff4',
      textSecondary: '#d8dee9',
      textTertiary: '#8692a5',
      accent: '#88c0d0',
      accentBtn: '#88c0d0',
    },
  },
  nord_light: {
    id: 'nord_light',
    name: 'Nord Frost',
    type: 'light',
    spacing: SPACING,
    colors: {
      bg: '#e5e9f0',
      surface: '#eceff4',
      surfaceAlt: '#d8dee9',
      border: '#c4c9d4',
      borderFocus: '#5e81ac',
      textPrimary: '#2e3440',
      textSecondary: '#4c566a',
      textTertiary: '#6b7494',
      accent: '#5e81ac',
      accentBtn: '#5e81ac',
    },
  },
  ayu: {
    id: 'ayu',
    name: 'Ayu Dark',
    type: 'dark',
    spacing: SPACING,
    colors: {
      bg: '#0f0e0d',
      surface: '#171614',
      surfaceAlt: '#252422',
      border: '#3d3b36',
      borderFocus: '#ff6b6b',
      textPrimary: '#f8f4e3',
      textSecondary: '#b9b39a',
      textTertiary: '#786e64',
      accent: '#ff6b6b',
      accentBtn: '#ff6b6b',
    },
  },
  ayu_light: {
    id: 'ayu_light',
    name: 'Ayu Mirage',
    type: 'light',
    spacing: SPACING,
    colors: {
      bg: '#f3f1eb',
      surface: '#faf8f5',
      surfaceAlt: '#e6e2d9',
      border: '#d4ceb8',
      borderFocus: '#f07178',
      textPrimary: '#5c5b4f',
      textSecondary: '#8a8475',
      textTertiary: '#a69e8e',
      accent: '#f07178',
      accentBtn: '#f07178',
    },
  },
  monokai: {
    id: 'monokai',
    name: 'Monokai',
    type: 'dark',
    spacing: SPACING,
    colors: {
      bg: '#272822',
      surface: '#1e1f1c',
      surfaceAlt: '#3e3d32',
      border: '#49483e',
      borderFocus: '#66d9e8',
      textPrimary: '#f8f8f2',
      textSecondary: '#cfcfc2',
      textTertiary: '#75715e',
      accent: '#66d9e8',
      accentBtn: '#66d9e8',
    },
  },
  monokai_light: {
    id: 'monokai_light',
    name: 'Monokai Pro',
    type: 'light',
    spacing: SPACING,
    colors: {
      bg: '#faf8f5',
      surface: '#f2efe9',
      surfaceAlt: '#e8e4db',
      border: '#ccc9c0',
      borderFocus: '#45a5b7',
      textPrimary: '#403e3b',
      textSecondary: '#6e6c67',
      textTertiary: '#98968c',
      accent: '#45a5b7',
      accentBtn: '#45a5b7',
    },
  },
  light: {
    id: 'light',
    name: 'Light',
    type: 'light',
    spacing: SPACING,
    colors: {
      bg: '#ffffff',
      surface: '#fafafa',
      surfaceAlt: '#f0f0f0',
      border: '#d8d8d8',
      borderFocus: '#a0a0a0',
      textPrimary: '#1a1a1a',
      textSecondary: '#555555',
      textTertiary: '#888888',
      accent: '#a0a0a0',
      accentBtn: '#1a1a1a',
    },
  },
};

export const THEME_LIST = Object.values(THEMES);
