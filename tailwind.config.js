/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50:  '#FDFBF7',
          100: '#FAF7F1',
          200: '#F5EFE4',
          300: '#EDE3D1',
          DEFAULT: '#F5EFE4',
        },
        bark: {
          50:  '#F4EDE4',
          100: '#E2CCBA',
          200: '#C4A07D',
          300: '#9E7250',
          400: '#7A5235',
          500: '#4E3220',
          600: '#351F10',
          700: '#1C1009',
          DEFAULT: '#1C1009',
        },
        terra: {
          50:  '#FBF0EA',
          100: '#F5D5C2',
          200: '#E8A97E',
          300: '#D4784A',
          400: '#B85528',
          500: '#8F3A14',
          DEFAULT: '#B85528',
          light: '#D4784A',
          dark:  '#8F3A14',
        },
        sand: {
          50:  '#F9F6F0',
          100: '#F0E9DB',
          200: '#E4D8C4',
          300: '#D5C4A8',
          400: '#C3AB88',
          DEFAULT: '#E4D8C4',
        },
        sage: {
          100: '#EEF0EA',
          200: '#D8DDD0',
          300: '#B8C0AA',
          DEFAULT: '#B8C0AA',
        },
      },
      fontFamily: {
        display: ['Cormorant Garamond', 'Georgia', 'serif'],
        serif:   ['Cormorant Garamond', 'Georgia', 'serif'],
        sans:    ['Jost', 'system-ui', 'sans-serif'],
        label:   ['Cormorant SC', 'Georgia', 'serif'],
      },
      boxShadow: {
        'card-sm': '0 2px 12px 0 rgba(28,16,9,0.06)',
        'card':    '0 4px 24px 0 rgba(28,16,9,0.09)',
        'card-lg': '0 8px 40px 0 rgba(28,16,9,0.13)',
        'btn':     '0 2px 8px 0 rgba(184,85,40,0.25)',
        'btn-lg':  '0 4px 20px 0 rgba(184,85,40,0.35)',
      },
    },
  },
  plugins: [],
}