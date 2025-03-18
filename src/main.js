import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import ReactDOM from 'react-dom/client';
// Import emotion cache first to ensure it's initialized before other UI libraries
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
// Create emotion cache
const emotionCache = createCache({
    key: 'css',
    prepend: true, // This ensures styles are prepended to the <head> instead of appended
});
// Pre-initialize framer-motion to ensure it loads before components
import { MotionConfig } from 'framer-motion';
// Now import other libraries
import { ThemeProvider } from '@mui/material/styles';
import { QueryClientProvider } from '@tanstack/react-query';
import { ToastContainer } from 'react-toastify';
import CssBaseline from '@mui/material/CssBaseline';
import { theme } from './theme';
import { queryClient } from './lib/query-client';
import { AuthProvider } from './lib/auth.tsx';
import App from './App.tsx';
import './index.css';
import 'react-toastify/dist/ReactToastify.css';
import ErrorBoundary from './components/ErrorBoundary';
// Note: We're now using the queryClient imported from './lib/query-client'
// which has been updated with our desired configuration
ReactDOM.createRoot(document.getElementById('root')).render(_jsx(React.StrictMode, { children: _jsx(CacheProvider, { value: emotionCache, children: _jsx(MotionConfig, { reducedMotion: "user", children: _jsx(QueryClientProvider, { client: queryClient, children: _jsxs(ThemeProvider, { theme: theme, children: [_jsx(CssBaseline, {}), _jsx(ErrorBoundary, { children: _jsxs(AuthProvider, { children: [_jsx(App, {}), _jsx(ToastContainer, { position: "bottom-right", autoClose: 5000, hideProgressBar: false, newestOnTop: true, closeOnClick: true, rtl: false, pauseOnFocusLoss: true, draggable: true, pauseOnHover: true, theme: "light" })] }) })] }) }) }) }) }));
