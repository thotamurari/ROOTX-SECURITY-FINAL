import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default defineConfig({
    base: './',
    plugins: [react()],
    resolve: {
        alias: {
            '@': resolve(__dirname, './src'),
        },
    },
    server: {
        port: 5173,
        fs: { strict: true },
    },
    optimizeDeps: {
        // Pre-bundle ALL deps that any lazy route chunk can import.
        // Without this, Vite discovers a dep the first time a route is
        // visited, stops to pre-bundle it, and the in-flight import may fail
        // or cause a blank screen that only "fixes" on refresh.
        include: [
            'react',
            'react-dom',
            'react-router-dom',
            'framer-motion',
            '@tanstack/react-query',
            'react-hook-form',
            '@hookform/resolvers/zod',
            'zod',
            'zustand',
            'axios',
            'axios-retry',
            'recharts',
            'd3',
            'react-simple-maps',
            'jspdf',
            'react-window',
            'socket.io-client',
            'firebase/app',
            'firebase/auth',
            'firebase/firestore',
            'lucide-react',
            'react-hot-toast',
        ],
    },
    build: {
        target: 'es2020',
        cssCodeSplit: true,
        chunkSizeWarningLimit: 600,
        rollupOptions: {
            output: {
                manualChunks: {
                    'vendor-react': ['react', 'react-dom', 'react-router-dom'],
                    'vendor-framer': ['framer-motion'],
                    'vendor-query': ['@tanstack/react-query'],
                    'vendor-ui': ['lucide-react', 'react-hot-toast'],
                    'vendor-backend': ['axios', 'zustand', 'zod'],
                },
            },
        },
    },
})
