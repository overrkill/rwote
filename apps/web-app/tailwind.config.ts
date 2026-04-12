import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: {
          light: '#ffffff',
          dark: '#0f0e0d',
        },
        surface: {
          light: '#fafafa',
          dark: '#1a1a19',
        },
        'surface-alt': {
          light: '#f0f0f0',
          dark: '#2a2a28',
        },
        border: {
          light: '#d8d8d8',
          dark: '#3a3a38',
        },
        'border-focus': {
          light: '#a0a0a0',
          dark: '#5a5a58',
        },
        primary: {
          light: '#1a1a1a',
          dark: '#f5f2ec',
        },
        secondary: {
          light: '#555555',
          dark: '#a0a0a0',
        },
        tertiary: {
          light: '#888888',
          dark: '#6a6a68',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Helvetica Neue', 'sans-serif'],
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '14px',
        xl: '18px',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(0,0,0,0.06)',
        md: '0 2px 6px rgba(0,0,0,0.1)',
      },
    },
  },
  plugins: [],
}
export default config
