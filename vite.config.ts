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
    // Increase the warning limit to reduce noise
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      },
      output: {
        // Configure manual chunks to split the bundle
        manualChunks: (id) => {
          // Create a vendors chunk for node_modules
          if (id.includes('node_modules')) {
            // Split major libraries into their own chunks
            if (id.includes('@mui')) {
              return 'vendor-mui';
            }
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
            if (id.includes('@fullcalendar')) {
              return 'vendor-calendar';
            }
            if (id.includes('chart.js') || id.includes('recharts')) {
              return 'vendor-charts';
            }
            // All other dependencies
            return 'vendor';
          }
          
          // Split application code by feature
          if (id.includes('/src/components/')) {
            return 'components';
          }
          if (id.includes('/src/hooks/')) {
            return 'hooks';
          }
          if (id.includes('/src/pages/')) {
            // Split large pages into separate chunks
            if (id.includes('/pages/POS.tsx')) {
              return 'page-pos';
            }
            if (id.includes('/pages/Appointments.tsx')) {
              return 'page-appointments';
            }
            return 'pages';
          }
        }
      }
    }
  }
})
