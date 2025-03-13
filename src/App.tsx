import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import Layout from './components/Layout';
import { DevRefresher } from './components/DevRefresher';
import Login from './pages/Login';
import { theme } from './theme';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { CircularProgress, Box } from '@mui/material';
import { AuthProvider } from './hooks/useAuth'; // Using the hook-based auth from main
import ProtectedRoute from './components/ProtectedRoute';

// Eagerly loaded pages
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';

// Lazy-loaded components
const Appointments = lazy(() => import('./pages/Appointments'));
const Clients = lazy(() => import('./pages/Clients'));
const Stylists = lazy(() => import('./pages/Stylists'));
const ServiceCollections = lazy(() => import('./pages/ServiceCollections'));
const ServiceCollectionDetail = lazy(() => import('./pages/ServiceCollectionDetail'));
const Orders = lazy(() => import('./pages/Orders'));
const POS = lazy(() => import('./pages/POS'));
const CollectionDetail = lazy(() => import('./pages/CollectionDetail'));
const Inventory = lazy(() => import('./pages/Inventory'));

// Loading fallback component
const PageLoader = () => (
  <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
    <CircularProgress />
  </Box>
);

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ToastContainer position="top-right" theme="dark" />
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout>
                  <Suspense fallback={<PageLoader />}>
                    <Outlet />
                  </Suspense>
                </Layout>
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="appointments" element={<Appointments />} />
            <Route path="clients" element={<Clients />} />
            <Route path="services" element={<ServiceCollections />} />
            <Route path="services/:id" element={<ServiceCollectionDetail />} />
            <Route path="stylists" element={<Stylists />} />
            <Route path="orders" element={<Orders />} />
            <Route path="pos" element={<POS />} />
            <Route path="members" element={<Members />} />
            <Route path="inventory" element={<Inventory />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
      
      {/* Only renders in development */}
      <DevRefresher />
    </ThemeProvider>
  );
}

export default App;