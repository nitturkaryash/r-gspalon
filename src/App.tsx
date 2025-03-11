import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import Layout from './components/Layout'
import { DevRefresher } from './components/DevRefresher'
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { theme } from './theme'; // Your theme configuration
import React, { lazy, Suspense } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Dashboard from './pages/Dashboard'
import Clients from './pages/Clients'
import Orders from './pages/Orders'
import Inventory from './pages/Inventory'
import CollectionDetail from './pages/CollectionDetail'
import ServiceCollections from './pages/ServiceCollections'
import ServiceCollectionDetail from './pages/ServiceCollectionDetail'
import Members from './pages/Members'
import Login from './pages/Login'
import { AuthProvider } from './hooks/useAuth'
import ProtectedRoute from './components/ProtectedRoute'
import { CircularProgress, Box } from '@mui/material';

// Lazy load larger pages
const Appointments = lazy(() => import('./pages/Appointments'));
const Stylists = lazy(() => import('./pages/Stylists'));
const POS = lazy(() => import('./pages/POS'));

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
            <Route path="inventory" element={<Inventory />} />
            <Route path="inventory/:id" element={<CollectionDetail />} />
            <Route path="members" element={<Members />} />
          </Route>
        </Routes>
      </AuthProvider>
      
      {/* Only renders in development */}
      <DevRefresher />
    </ThemeProvider>
  )
}

export default App
