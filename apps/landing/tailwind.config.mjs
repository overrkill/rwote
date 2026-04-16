/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        primary: '#2d2926',
        secondary: '#6b6560',
        accent: '#e85d04',
        surface: '#ffffff',
        surfaceAlt: '#f5f3f0',
        bg: '#faf9f7',
        border: '#e8e5e0',
      },
      fontFamily: {
        display: ["'Grand Hotel', cursive"],
        sans: ["-apple-system", 'BlinkMacSystemFont', "'Segoe UI'", 'Roboto', 'sans-serif'],
        mono: ["'DM Mono', monospace"],
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
