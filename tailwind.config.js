/** Defervo design tokens. Fresh clinical theme: mint-white paper, forest green, signal red for fever. */
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['"Instrument Sans Variable"', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
      colors: {
        // Forest green: primary actions, headings, structure
        brand: { 50: '#ECF8F4', 100: '#D3F0E7', 200: '#A7E0CF', 300: '#70C9B0', 400: '#38AD8F', 500: '#159577', 600: '#0F7C64', 700: '#0D6452', 800: '#0D4F42', 900: '#0B3F36' },
        // "Ready to go home" blue (discharge pipeline), replaces the default violet
        violet: { 50: '#EEF3FF', 100: '#DDE7FF', 200: '#BCCEFF', 300: '#91AEFC', 400: '#6287F6', 500: '#3F66EC', 600: '#2D4FD6', 700: '#2540AE', 800: '#22388A', 900: '#20326E' },
        paper: '#F3F8F6',
        rule: '#DCE9E1',
        grid: '#E2EEE7',
      },
      borderRadius: { DEFAULT: '6px', lg: '8px', xl: '10px', '2xl': '14px' },
      boxShadow: { card: '0 0 0 0 transparent', pop: '0 12px 32px -12px rgba(15,59,43,.22), 0 2px 6px rgba(15,59,43,.06)' },
    },
  },
  plugins: [],
}
