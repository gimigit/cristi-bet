import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        won:    '#4ade80',
        lost:   '#f87171',
        open:   '#38bdf8',
        accent: '#a78bfa',
      },
    },
  },
  plugins: [],
}

export default config
