import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, './src'),
      '@shared/ui': resolve(import.meta.dirname, '../../packages/ui/src'),
      '@shared/types': resolve(import.meta.dirname, '../../packages/types/src'),
      '@shared/map': resolve(import.meta.dirname, '../../packages/map/src'),
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
    port: 5174,
    warmup: {
      clientFiles: [
        './src/main.tsx',
        './src/App.tsx',
        './src/features/dashboard/DashboardPage.tsx',
      ],
    },
  },
})
