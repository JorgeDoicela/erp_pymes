/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    borderRadius: {
      'none': '0px',
      'sm': '2px',
      DEFAULT: '4px',
      'md': '4px',
      'lg': '6px',
      'xl': '6px',
      '2xl': '6px',
      '3xl': '6px',
      'full': '9999px',
    },
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563eb', // blue-600 (acento ERP)
          light: '#3b82f6',   // blue-500
          dark: '#1d4ed8',    // blue-700
        },
        secondary: {
          DEFAULT: '#4b5563', // gray-600
          light: '#6b7280',   // gray-500
          dark: '#374151',    // gray-700
        },
        surface: {
          DEFAULT: '#f9fafb', // gray-50
          muted: '#ffffff',   // white
        }
      },
      boxShadow: {
        'none': 'none',
        '2xs': 'none',
        'xs': 'none',
        'sm': 'none',
        DEFAULT: 'none',
        'md': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'lg': '0 2px 4px 0 rgba(0, 0, 0, 0.05)',
        'xl': '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        '2xl': '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
      }
    },
  },
  plugins: [],
}

