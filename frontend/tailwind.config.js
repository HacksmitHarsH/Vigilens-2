/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0a0e13',
        panel: '#101720',
        elevated: '#151f2a',
        line: '#263442',
        muted: '#91a0ae',
        aqua: '#55e2d0',
        violet: '#a69aff',
      },
      boxShadow: { glow: '0 0 32px rgba(85, 226, 208, .10)' },
      fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
}
