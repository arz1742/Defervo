/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
      colors: {
        brand: { 50:'#effcf9',100:'#c9f5ec',200:'#94e9da',300:'#58d6c4',400:'#2bbcab',500:'#139f91',600:'#0d8077',700:'#0f6661',800:'#11514e',900:'#124442' },
      },
      boxShadow: { card: '0 1px 2px rgba(16,24,40,.04), 0 1px 3px rgba(16,24,40,.06)' },
    },
  },
  plugins: [],
}
