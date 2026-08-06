import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            injectRegister: 'auto',
            includeAssets: ['favicon.webp'],
            manifest: {
                name: 'Emplifi - ERP',
                short_name: 'Emplifi',
                description: 'Plataforma de gestión de erp',
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
                    { src: '/favicon.webp', sizes: '512x512', type: 'image/webp', purpose: 'maskable' }
                ]
            },
            devOptions: {
                enabled: true
            },
            workbox: {
                clientsClaim: true,
                skipWaiting: true,
                cleanupOutdatedCaches: true,
                globPatterns: [], // 0% precache de archivos estáticos
                navigateFallback: null, // Desactivar la caché de index.html en navegación SPA
                runtimeCaching: [
                    {
                        urlPattern: /.*/i,
                        handler: 'NetworkOnly' // 100% de peticiones van siempre a la red
                    }
                ]
            }
        })
    ],
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
        proxy: {
            '/api': {
                target: 'http://localhost:4000',
                changeOrigin: true,
                secure: false,
            },
            '/uploads': {
                target: 'http://localhost:4000',
                changeOrigin: true,
                secure: false,
            },
        },
        watch: {
            usePolling: true, // Sometimes needed on Windows for faster detection
        }
    },
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './src/test/setup.js',
        include: ['src/**/*.test.{js,jsx}'],
    }
})

