/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2d2926',
          dark: '#faf9f7',
        },
        secondary: {
          DEFAULT: '#6b6560',
          dark: '#9a9590',
        },
        accent: '#e85d04',
        surface: {
          DEFAULT: '#ffffff',
          dark: '#1a1917',
        },
        surfaceAlt: {
          DEFAULT: '#f5f3f0',
          dark: '#252422',
        },
        bg: {
          DEFAULT: '#faf9f7',
          dark: '#0f0e0d',
        },
        border: {
          DEFAULT: '#e8e5e0',
          dark: '#2d2b28',
        },
      },
      fontFamily: {
        display: ["'Grand Hotel', cursive"],
        sans: ["-apple-system", 'BlinkMacSystemFont', "'Segoe UI'", 'Roboto', 'sans-serif'],
        mono: ["'DM Mono', monospace"],
      },
      animation: {
        'fade-up': 'fadeUp 0.6s ease-out forwards',
        'float': 'float 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(232, 93, 4, 0.3)' },
          '100%': { boxShadow: '0 0 40px rgba(232, 93, 4, 0.6)' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
