/** Defervo design tokens. Fresh clinical theme: mint-white paper, forest green, signal red for fever. */
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['"Instrument Sans Variable"', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
      colors: {
        // Forest green: primary actions, headings, structure
        brand: { 50: '#EEF7F2', 100: '#D9EFE3', 200: '#B3DEC8', 300: '#82C6A5', 400: '#4EA87F', 500: '#2D8C63', 600: '#1E7250', 700: '#175C41', 800: '#134A35', 900: '#0F3B2B' },
        // "Ready to go home" blue (discharge pipeline), replaces the default violet
        violet: { 50: '#EEF3FF', 100: '#DDE7FF', 200: '#BCCEFF', 300: '#91AEFC', 400: '#6287F6', 500: '#3F66EC', 600: '#2D4FD6', 700: '#2540AE', 800: '#22388A', 900: '#20326E' },
        paper: '#F4F9F6',
        rule: '#DCE9E1',
        grid: '#E2EEE7',
      },
      borderRadius: { DEFAULT: '6px', lg: '8px', xl: '10px', '2xl': '14px' },
      boxShadow: { card: '0 0 0 0 transparent', pop: '0 12px 32px -12px rgba(15,59,43,.22), 0 2px 6px rgba(15,59,43,.06)' },
    },
  },
  plugins: [],
}
