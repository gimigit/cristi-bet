/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        bg: '#09090b',
        surface: '#18181b',
        border: '#27272a',
        text: '#f4f4f5',
        muted: '#71717a',
        won: '#4ade80',
        lost: '#f87171',
        open: '#38bdf8',
        accent: '#a78bfa',
        push: '#facc15',
      },
    },
  },
  plugins: [],
};
