import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Allow external connections (needed for ngrok)
    port: 5173,
    allowedHosts: true, // Allow all hosts (needed for ngrok tunneling)
    proxy: {
      // Proxy API requests to backend - this way ngrok only needs to expose frontend
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
      }
    }
  },
})
