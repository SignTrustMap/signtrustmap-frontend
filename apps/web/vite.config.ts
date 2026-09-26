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
    warmup: {
      clientFiles: [
        './src/main.tsx',
        './src/App.tsx',
        './src/features/home/HomePage.tsx',
      ],
    },
  },
})

