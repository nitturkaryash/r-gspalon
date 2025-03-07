import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
  ],
  server: {
    hmr: {
      // Force WebSocket protocol for HMR
      protocol: 'ws',
      // Show more verbose HMR logs for debugging
      overlay: true,
    },
    // Add headers to prevent caching
    headers: {
      'Cache-Control': 'no-store',
    },
    // Show more detailed errors
    strictPort: false,
    watch: {
      // Use polling in environments that don't support file system events
      usePolling: false,
      // Decrease the delay between file change and reload
      interval: 100,
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      }
    }
  }
})
