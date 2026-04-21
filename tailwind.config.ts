import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './contexts/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#13ec5b',
        'primary-600': '#0fd651',
        'primary-700': '#0bb143',
        'background-light': '#fafaf7',
        'background-dark': '#0a1a12',
        'surface-light': '#ffffff',
        'surface-dark': '#10261a',
        'text-main': '#0c1410',
        'text-muted': '#5c7a68',
        'teal-accent': '#0d4035',
        'ink': {
          50: '#f6f8f6',
          100: '#e8ede9',
          200: '#cfd8d1',
          300: '#a6b6aa',
          400: '#78907f',
          500: '#56725f',
          600: '#3f5948',
          700: '#2c4234',
          800: '#162b1e',
          900: '#0a1a12',
          950: '#06110a',
        },
      },
      fontFamily: {
        'display': ['"Inter Tight"', 'Inter', 'system-ui', 'sans-serif'],
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'serif': ['"Instrument Serif"', 'Georgia', 'serif'],
      },
      letterSpacing: {
        'tightest': '-0.04em',
      },
      borderRadius: {
        'DEFAULT': '0.375rem',
        'lg': '0.5rem',
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
        'full': '9999px',
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(10, 26, 18, 0.04), 0 1px 1px 0 rgba(10, 26, 18, 0.02)',
        'card': '0 1px 2px 0 rgba(10, 26, 18, 0.04), 0 8px 24px -12px rgba(10, 26, 18, 0.10)',
        'elevated': '0 2px 4px 0 rgba(10, 26, 18, 0.04), 0 24px 48px -16px rgba(10, 26, 18, 0.14)',
      },
      keyframes: {
        'marquee': {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        'marquee': 'marquee 40s linear infinite',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
}

export default config
