import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      jsxImportSource: '@emotion/react',
      babel: {
        plugins: ['@emotion/babel-plugin']
      }
    }),
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
    chunkSizeWarningLimit: 1000,
    // Add minify options to better handle initialization order
    minify: 'esbuild',
    // Add esbuild options
    target: 'es2020',
    cssTarget: 'chrome80',
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
            if (id.includes('@emotion')) {
              return 'vendor-emotion';
            }
            if (id.includes('framer-motion')) {
              return 'vendor-framer-motion';
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
            if (id.includes('@tanstack/react-query')) {
              return 'vendor-react-query';
            }
            // All other dependencies
            return 'vendor';
          }
          
          // Split application code by feature
          if (id.includes('/src/components/')) {
            // Split large components into their own chunks
            if (id.includes('/components/StylistDayView.tsx')) {
              return 'component-stylist-day-view';
            }
            if (id.includes('/components/Layout')) {
              return 'component-layout';
            }
            if (id.includes('/components/charts/')) {
              return 'component-charts';
            }
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
            if (id.includes('/pages/Dashboard.tsx')) {
              return 'page-dashboard';
            }
            if (id.includes('/pages/Stylists.tsx')) {
              return 'page-stylists';
            }
            return 'pages';
          }
          // Add a utils chunk
          if (id.includes('/src/utils/')) {
            return 'utils';
          }
        }
      }
    }
  },
  optimizeDeps: {
    // Include more dependencies for pre-bundling to prevent issues
    include: [
      '@emotion/react', 
      '@emotion/styled', 
      '@mui/material/Tooltip',
      '@mui/material',
      '@mui/icons-material',
      'react-router-dom',
      'react-toastify',
      'framer-motion'
    ],
    // Force nested dependencies to be pre-bundled
    force: true
  },
  // Add resolve aliases for cleaner imports
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
})
