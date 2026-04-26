import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#004225', // Solid Forest Green
        secondary: '#009870', // Solid Emerald Green
        background: '#FDFDFB', // Stone White
        'deep-ink': '#1A1A1A', // Deep Ink
        'light-border': '#E2E8F0', // Universal border
        'off-white': '#F8F9FA',
      },
      fontFamily: {
        serif: ['var(--font-heading)', 'Instrument Serif', 'serif'],
        sans: ['var(--font-body)', 'Public Sans', 'sans-serif'],
        heading: ['var(--font-heading)', 'Instrument Serif', 'serif'],
        body: ['var(--font-body)', 'Public Sans', 'sans-serif'],
      },
      fontWeight: {
        medium: '500',
      },
    },
  },
  plugins: [],
}

export default config