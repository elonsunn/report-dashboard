import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',   // listen on all interfaces so Windows host can reach WSL2
    proxy: {
      // Proxy all /api requests to the Django backend during development
      '/api': 'http://localhost:8000'
    }
  }
})
