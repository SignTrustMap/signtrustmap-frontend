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
    },
  },
  server: {
    port: 5174,
  },
})
