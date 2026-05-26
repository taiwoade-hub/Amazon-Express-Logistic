/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#f7f9fb',
        surface: '#ffffff',
        navy: '#0f172a',
        text: '#0f172a',
        'text-muted': '#64748b',
        primary: '#2563eb',
        accent: '#dc2626',
        border: '#e2e8f0',
        'border-active': '#2563eb',
        'status-transit': '#3b82f6',
        'status-delivered': '#10b981',
        'status-delayed': '#ef4444',
        'status-pending': '#94a3b8'
      }
    },
  },
  plugins: [],
}
