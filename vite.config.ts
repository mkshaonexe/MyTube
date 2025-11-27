import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: false, // Don't auto-open browser (Electron will load it)
  },
  build: {
    outDir: 'dist',
  },
})
