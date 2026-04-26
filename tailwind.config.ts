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
        primary: '#064e3b', // Deep Forest Green
        background: '#0a0a0a', // Rich Onyx
        emerald: '#10b981', // Emerald for focus
        gold: '#d4af37', // Gold for focus
        // Add other colors as needed
      },
      fontFamily: {
        heading: ['Playfair Display', 'serif'],
        body: ['Geist', 'sans-serif'],
      },
      ringColor: {
        'emerald': '#10b981',
        'gold': '#d4af37',
      },
    },
  },
  plugins: [],
}

export default config