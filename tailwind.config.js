/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        editor: {
          bg: '#1e1e1e',
          surface: '#252526',
          border: '#3c3c3c',
          active: '#007acc',
          muted: '#858585',
        }
      }
    },
  },
  plugins: [],
}
