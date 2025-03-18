import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import Layout from './components/Layout';
import Login from './pages/Login';
import { theme } from './theme';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { CircularProgress, Box, Typography, Button } from '@mui/material';
import { AuthProvider } from './components/AuthProvider';
import Dashboard from './pages/Dashboard';
import Services from './pages/Services';
import Appointments from './pages/Appointments';
import Clients from './pages/Clients';
import Stylists from './pages/Stylists';
import Orders from './pages/Orders';
import Settings from './pages/Settings';
import LocalDataTest from './pages/LocalDataTest';
import DatabaseCheck from './pages/DatabaseCheck';
import { initLocalStorageData } from './utils/initLocalStorageData';
import TestImports from './TestImports';
// Lazy load components
const ServiceCollections = lazy(() => import('./pages/ServiceCollections'));
const ServiceCollectionDetail = lazy(() => import('./pages/ServiceCollectionDetail'));
const Inventory = lazy(() => import('./pages/Inventory'));
const InventorySetup = lazy(() => import('./pages/InventorySetup'));
const ProductCollections = lazy(() => import('./pages/ProductCollections'));
const ProductCollectionDetail = lazy(() => import('./pages/ProductCollectionDetail'));
const ProductSetup = lazy(() => import('./pages/ProductSetup'));
const Products = lazy(() => import('./pages/Products'));
const POS = lazy(() => import('./pages/POS'));
const Members = lazy(() => import('./pages/Members'));
// Loading fallback component
const LoadingFallback = () => (_jsx(Box, { sx: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }, children: _jsx(CircularProgress, {}) }));
// DEVELOPMENT MODE flag
const DEVELOPMENT_MODE = true;
// Simple component to bypass authentication in development mode
const DevModeRedirect = () => {
    React.useEffect(() => {
        // Set up auth tokens
        const dummyUser = {
            id: 'dev-user-id',
            username: 'admin',
            role: 'admin',
        };
        localStorage.setItem('auth_token', 'dummy-token-' + Date.now());
        localStorage.setItem('auth_user', JSON.stringify(dummyUser));
        // Show success message
        toast.success('Development mode: Auto-login successful');
        // Redirect to dashboard
        window.location.href = '/dashboard';
    }, []);
    return (_jsxs(Box, { sx: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }, children: [_jsx(CircularProgress, {}), _jsx(Typography, { variant: "body1", sx: { ml: 2 }, children: "Development mode: Redirecting to dashboard..." })] }));
};
// Error Boundary component for catching React Router errors
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, errorInfo) {
        console.error("Error caught by ErrorBoundary:", error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            return (_jsxs(Box, { sx: { p: 4, textAlign: 'center' }, children: [_jsx(Typography, { variant: "h5", color: "error", gutterBottom: true, children: "Something went wrong" }), _jsx(Typography, { variant: "body1", gutterBottom: true, children: this.state.error?.message || 'An unexpected error occurred' }), _jsx(Button, { variant: "contained", color: "primary", onClick: () => window.location.href = '/', sx: { mt: 2 }, children: "Return to Home" })] }));
        }
        return this.props.children;
    }
}
function App() {
    // Check if we should redirect to login
    React.useEffect(() => {
        // In development mode, always set up auth
        if (DEVELOPMENT_MODE) {
            const dummyUser = {
                id: 'dev-user-id',
                username: 'admin',
                role: 'admin',
            };
            localStorage.setItem('auth_token', 'dummy-token-' + Date.now());
            localStorage.setItem('auth_user', JSON.stringify(dummyUser));
            // Also set up demo mode for analytics
            localStorage.setItem('salon_demo_auth', JSON.stringify({
                isAuthenticated: true,
                user: {
                    id: 'dev-user-id',
                    name: 'Admin User',
                    role: 'admin'
                }
            }));
            // Initialize sample data for testing in development mode
            // Only initialize if data doesn't exist yet
            if (!localStorage.getItem('local_services') ||
                !localStorage.getItem('local_stylists') ||
                !localStorage.getItem('local_products')) {
                initLocalStorageData();
            }
            console.log('🔧 DEVELOPMENT MODE: Auto-login enabled');
        }
    }, []);
    return (_jsxs(ThemeProvider, { theme: theme, children: [_jsx(CssBaseline, {}), _jsx(ToastContainer, { position: "top-right", theme: "dark" }), _jsx(TestImports, {}), _jsx(AuthProvider, { children: _jsx(ErrorBoundary, { children: _jsx(Suspense, { fallback: _jsx(LoadingFallback, {}), children: _jsx(Router, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/login", element: DEVELOPMENT_MODE ? _jsx(DevModeRedirect, {}) : _jsx(Login, {}) }), _jsxs(Route, { path: "/", element: _jsx(Layout, {}), children: [_jsx(Route, { index: true, element: _jsx(Dashboard, {}) }), _jsx(Route, { path: "dashboard", element: _jsx(Dashboard, {}) }), _jsx(Route, { path: "orders", element: _jsx(Orders, {}) }), _jsx(Route, { path: "services", element: _jsx(Services, {}) }), _jsx(Route, { path: "services/:id", element: _jsx(ServiceCollectionDetail, {}) }), _jsx(Route, { path: "stylists", element: _jsx(Stylists, {}) }), _jsx(Route, { path: "clients", element: _jsx(Clients, {}) }), _jsx(Route, { path: "appointments", element: _jsx(Appointments, {}) }), _jsx(Route, { path: "inventory", element: _jsx(Inventory, {}) }), _jsx(Route, { path: "inventory-setup", element: _jsx(InventorySetup, {}) }), _jsx(Route, { path: "products", element: _jsx(Products, {}) }), _jsx(Route, { path: "product-collections", element: _jsx(ProductCollections, {}) }), _jsx(Route, { path: "products/:id", element: _jsx(ProductCollectionDetail, {}) }), _jsx(Route, { path: "products-setup", element: _jsx(ProductSetup, {}) }), _jsx(Route, { path: "pos", element: _jsx(POS, {}) }), _jsx(Route, { path: "members", element: _jsx(Members, {}) }), _jsx(Route, { path: "database-check", element: _jsx(DatabaseCheck, {}) }), _jsx(Route, { path: "local-data", element: _jsx(LocalDataTest, {}) }), _jsx(Route, { path: "settings", element: _jsx(Settings, {}) }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/", replace: true }) })] })] }) }) }) }) })] }));
}
export default App;
