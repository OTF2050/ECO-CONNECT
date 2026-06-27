/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        eco: {
          dark: '#0a0e17',
          green: '#1b4d3e',
          sand: '#d49a43',
        }
      }
    },
  },
  plugins: [],
}
