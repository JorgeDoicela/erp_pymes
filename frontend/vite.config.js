import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'axios',
      'framer-motion',
      'recharts',
      'react-icons/fi',
      'react-hot-toast'
    ]
  },
  server: {
    watch: {
      usePolling: true, // Sometimes needed on Windows for faster detection
    }
  }
})
