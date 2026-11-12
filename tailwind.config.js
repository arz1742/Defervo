/** Defervo design tokens. Hospital fever-chart language: chart paper, ink, signal red. */
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['"Instrument Sans Variable"', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
      colors: {
        // Ink: primary text, primary actions, structure
        brand: { 50: '#EEF2F8', 100: '#DCE3EF', 200: '#B8C5DC', 300: '#8B9DBD', 400: '#5D7299', 500: '#3E5379', 600: '#263B62', 700: '#1C2D4D', 800: '#14213D', 900: '#0E172B' },
        // "Ready to go home" blue (discharge pipeline), replaces the default violet
        violet: { 50: '#EEF3FF', 100: '#DDE7FF', 200: '#BCCEFF', 300: '#91AEFC', 400: '#6287F6', 500: '#3F66EC', 600: '#2D4FD6', 700: '#2540AE', 800: '#22388A', 900: '#20326E' },
        paper: '#F4F6FA',
        rule: '#DDE3EC',
        grid: '#E3E9F2',
      },
      borderRadius: { DEFAULT: '6px', lg: '8px', xl: '10px', '2xl': '14px' },
      boxShadow: { card: '0 0 0 0 transparent', pop: '0 12px 32px -12px rgba(20,33,61,.28), 0 2px 6px rgba(20,33,61,.08)' },
    },
  },
  plugins: [],
}
