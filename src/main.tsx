import React from 'react'
import ReactDOM from 'react-dom/client'

// Import emotion cache first to ensure it's initialized before other UI libraries
import { CacheProvider } from '@emotion/react'
import createCache from '@emotion/cache'

// Create emotion cache
const emotionCache = createCache({
  key: 'css',
  prepend: true, // This ensures styles are prepended to the <head> instead of appended
})

// Pre-initialize framer-motion to ensure it loads before components
import { MotionConfig } from 'framer-motion'

// Now import other libraries
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'
import { QueryClientProvider } from '@tanstack/react-query'
import { ToastContainer } from 'react-toastify'
import CssBaseline from '@mui/material/CssBaseline'
import { theme } from './theme'
import { queryClient } from './lib/query-client'
import { AuthProvider } from './contexts/AuthContext'
import App from './App.tsx'
import './index.css'
import 'react-toastify/dist/ReactToastify.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <CacheProvider value={emotionCache}>
      <MotionConfig reducedMotion="user">
        <QueryClientProvider client={queryClient}>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <AuthProvider>
              <BrowserRouter>
                <App />
                <ToastContainer
                  position="bottom-right"
                  autoClose={5000}
                  hideProgressBar={false}
                  newestOnTop
                  closeOnClick
                  rtl={false}
                  pauseOnFocusLoss
                  draggable
                  pauseOnHover
                  theme="light"
                />
              </BrowserRouter>
            </AuthProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </MotionConfig>
    </CacheProvider>
  </React.StrictMode>,
)
