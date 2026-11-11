import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  envDir: '../',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@core': path.resolve(__dirname, './src/core'),
      '@modules': path.resolve(__dirname, './src/modules'),
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.webp'],
      manifest: {
        name: 'Norma ERP - Gestión Empresarial',
        short_name: 'Norma ERP',
        description: 'Plataforma ERP de Gestión del Talento Humano y Nómina Legal',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'any',
        scope: '/',
        start_url: '/',
        categories: ['business', 'productivity', 'utilities'],
        icons: [
          { src: '/favicon.webp', sizes: '64x64', type: 'image/webp' },
          { src: '/favicon.webp', sizes: '192x192', type: 'image/webp' },
          { src: '/favicon.webp', sizes: '512x512', type: 'image/webp' },
          { src: '/favicon.webp', sizes: '512x512', type: 'image/webp', purpose: 'maskable' },
        ],
      },
      devOptions: {
        enabled: false,
      },
      workbox: {
        clientsClaim: true,
        skipWaiting: true,
        cleanupOutdatedCaches: true,
        globPatterns: [], // 0% precache de archivos estáticos
        navigateFallback: null, // Desactivar la caché de index.html en navegación SPA
        // Excluir dominios externos del SW para evitar errores no-response
        navigateFallbackDenylist: [
          /^https:\/\/static\.cloudflareinsights\.com/,
          /^https:\/\/cloudflareinsights\.com/,
        ],
        runtimeCaching: [
          {
            // Solo interceptar peticiones del mismo origen (norma.doicela.dev)
            // Los dominios externos pasan directamente sin pasar por el SW
            urlPattern: ({ url }) => url.origin === self.location.origin,
            handler: 'NetworkOnly',
          },
        ],
      },
    }),
  ],
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('recharts') || id.includes('d3-')) {
              return 'vendor-charts';
            }
            if (id.includes('jspdf')) {
              return 'vendor-pdf';
            }
            if (id.includes('katex')) {
              return 'vendor-math';
            }
            if (id.includes('framer-motion')) {
              return 'vendor-motion';
            }
            if (id.includes('react-icons')) {
              return 'vendor-icons';
            }
          }
        },
      },
    },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'axios',
      'framer-motion',
      'recharts',
      'react-icons/fi',
      'react-hot-toast',
    ],
  },
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_BACKEND_URL || 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: process.env.VITE_BACKEND_URL || 'http://localhost:5000',
        ws: true,
        changeOrigin: true,
      },
      '/uploads': {
        target: process.env.VITE_BACKEND_URL || 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
    watch: {
      usePolling: true, // Sometimes needed on Windows for faster detection
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    include: ['src/**/*.test.{js,jsx}'],
  },
});
