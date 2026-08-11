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
                enabled: false
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
                        // Solo interceptar peticiones del mismo origen (erp.jorgedoicela.com)
                        // Los dominios externos pasan directamente sin pasar por el SW
                        urlPattern: ({ url }) => url.origin === self.location.origin,
                        handler: 'NetworkOnly'
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

