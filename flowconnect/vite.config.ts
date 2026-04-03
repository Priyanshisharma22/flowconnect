import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'https://flowconnect-backend-production.up.railway.app',
      '/webhook': 'https://flowconnect-backend-production.up.railway.app',
    }
  }
})