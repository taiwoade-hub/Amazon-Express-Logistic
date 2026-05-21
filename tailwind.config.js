/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#f7f7f8',
        surface: '#ffffff',
        text: '#0b0b0c',
        'text-muted': '#6b7280',
        primary: '#0b0b0c',
        border: '#e5e7eb',
        'border-active': '#0b0b0c'
      }
    },
  },
  plugins: [],
}
