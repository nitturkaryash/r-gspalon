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
import { DatabaseProvider } from './context/DatabaseProvider';

// Lazy load components
const ServiceCollections = lazy(() => import('./pages/ServiceCollections'));
const ServiceCollectionDetail = lazy(() => import('./pages/ServiceCollectionDetail'));
const Inventory = lazy(() => import('./pages/Inventory'));
const InventorySetup = lazy(() => import('./pages/InventorySetup'));
const POS = lazy(() => import('./pages/POS'));
const Members = lazy(() => import('./pages/Members'));

// Loading fallback component
const LoadingFallback = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <CircularProgress />
  </Box>
);

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
  
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <CircularProgress />
      <Typography variant="body1" sx={{ ml: 2 }}>
        Development mode: Redirecting to dashboard...
      </Typography>
    </Box>
  );
};

// Error Boundary component for catching React Router errors
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5" color="error" gutterBottom>
            Something went wrong
          </Typography>
          <Typography variant="body1" gutterBottom>
            {this.state.error?.message || 'An unexpected error occurred'}
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => window.location.href = '/'}
            sx={{ mt: 2 }}
          >
            Return to Home
          </Button>
        </Box>
      );
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
  
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ToastContainer position="top-right" theme="dark" />
      <TestImports />
      <AuthProvider>
        <DatabaseProvider>
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <Router>
                <Routes>
                  {/* In development mode, redirect login to auto-login */}
                  <Route path="/login" element={DEVELOPMENT_MODE ? <DevModeRedirect /> : <Login />} />
                  <Route path="/" element={<Layout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="orders" element={<Orders />} />
                    <Route path="services" element={<Services />} />
                    <Route path="services/:id" element={<ServiceCollectionDetail />} />
                    <Route path="stylists" element={<Stylists />} />
                    <Route path="clients" element={<Clients />} />
                    <Route path="appointments" element={<Appointments />} />
                    <Route path="inventory" element={<Inventory />} />
                    <Route path="inventory-setup" element={<InventorySetup />} />
                    <Route path="pos" element={<POS />} />
                    <Route path="members" element={<Members />} />
                    <Route path="database-check" element={<DatabaseCheck />} />
                    <Route path="local-data" element={<LocalDataTest />} />
                    <Route path="settings" element={<Settings />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Route>
                </Routes>
              </Router>
            </Suspense>
          </ErrorBoundary>
        </DatabaseProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;