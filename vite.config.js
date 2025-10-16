import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // host: '0.0.0.0',
    // port: 3001,
    proxy: {
      // forward any request starting with /api to your backend
      '/api': {
        target: 'http://192.168.1.120:5000', // or http://localhost:5000
        changeOrigin: true,
        // if your backend does not actually have a /api prefix, add:
        // rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/auth': {
        target: 'http://192.168.1.120:5000',
        changeOrigin: true,
      }
    }
  }
})

