/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Geist', 'SF Pro Display', 'Helvetica Neue', 'sans-serif'],
        mono: ['"Geist Mono"', '"JetBrains Mono"', 'monospace'],
        serif: ['"Instrument Serif"', 'Newsreader', 'serif'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        pastel: {
          blue: { bg: '#132230', text: '#7dd3fc', border: '#1e3a5f' },
          green: { bg: '#122417', text: '#86efac', border: '#1d4a2b' },
          yellow: { bg: '#291e0a', text: '#fde047', border: '#523c14' },
          red: { bg: '#2b1416', text: '#fca5a5', border: '#542025' },
        }
      },
      borderRadius: {
        lg: "6px",
        md: "4px",
        sm: "3px",
      },
      boxShadow: {
        'micro': '0 1px 2px rgba(0, 0, 0, 0.04)',
      },
    },
  },
  plugins: [],
}
