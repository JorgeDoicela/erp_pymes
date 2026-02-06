/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#172554', // blue-950
          light: '#1e3a8a',   // blue-900
          dark: '#0f172a',    // slate-900
        },
        secondary: {
          DEFAULT: '#10B981', // emerald-500
          light: '#34d399',   // emerald-400
          dark: '#059669',    // emerald-600
        },
        surface: {
          DEFAULT: '#F8FAFC', // slate-50
          muted: '#F1F5F9',   // slate-100
        }
      }
    },
  },
  plugins: [],
}
