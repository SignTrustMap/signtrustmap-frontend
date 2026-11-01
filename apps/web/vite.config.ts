import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
      '@shared/ui': path.resolve(import.meta.dirname, '../../packages/ui/src'),
      '@shared/types': path.resolve(import.meta.dirname, '../../packages/types/src'),
      '@shared/map': path.resolve(import.meta.dirname, '../../packages/map/src'),
    },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'leaflet',
      '@phosphor-icons/react',
      'axios',
      'i18next',
      'react-i18next',
    ],
  },
  server: {
    port: 5173,
    proxy: {
      // 1. Core Backend API Gateway route (/api/v1/*)
      '/api/v1': {
        target: process.env.VITE_GATEWAY_TARGET || process.env.VITE_BACKEND_TARGET || 'https://api.signmap.site',
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('proxyRes', (proxyRes) => {
            proxyRes.headers['x-proxied-by'] = 'vite-dev-gateway-proxy'
          })
        },
      },
      // 2. Jetson Orin Edge AI Gateway route (/ai/*)
      '/ai': {
        target: process.env.VITE_AI_TARGET || 'https://ai.signmap.site',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/ai/, ''),
        ws: true,
        configure: (proxy) => {
          proxy.on('proxyRes', (proxyRes) => {
            proxyRes.headers['x-proxied-by'] = 'vite-dev-gateway-proxy'
          })
        },
      },
      // 3. Object Storage / Media Gateway route (/storage/*)
      '/storage': {
        target: process.env.VITE_STORAGE_TARGET || 'https://s3.signmap.site',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/storage/, ''),
        configure: (proxy) => {
          proxy.on('proxyRes', (proxyRes) => {
            proxyRes.headers['x-proxied-by'] = 'vite-dev-gateway-proxy'
          })
        },
      },
    },
    warmup: {
      clientFiles: [
        './src/main.tsx',
        './src/App.tsx',
        './src/features/home/HomePage.tsx',
      ],
    },
  },
})

