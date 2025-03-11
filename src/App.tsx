import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Layout from './components/Layout';
import Login from './pages/Login';
import PageLoader from './components/PageLoader';
import theme from './theme';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import Inventory from './pages/Inventory';

// Lazy-loaded components for better performance
const Appointments = lazy(() => import('./pages/Appointments'));
const Clients = lazy(() => import('./pages/Clients'));
const ClientDetails = lazy(() => import('./pages/ClientDetails'));
const Stylists = lazy(() => import('./pages/Stylists'));
const Services = lazy(() => import('./pages/Services'));
const Reports = lazy(() => import('./pages/Reports'));

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route
                path="appointments"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <Appointments />
                  </Suspense>
                }
              />
              <Route path="clients" element={
                <Suspense fallback={<PageLoader />}>
                  <Clients />
                </Suspense>
              } />
              <Route path="clients/:id" element={
                <Suspense fallback={<PageLoader />}>
                  <ClientDetails />
                </Suspense>
              } />
              <Route path="stylists" element={
                <Suspense fallback={<PageLoader />}>
                  <Stylists />
                </Suspense>
              } />
              <Route path="services" element={
                <Suspense fallback={<PageLoader />}>
                  <Services />
                </Suspense>
              } />
              <Route path="reports" element={
                <Suspense fallback={<PageLoader />}>
                  <Reports />
                </Suspense>
              } />
              <Route path="members" element={<Members />} />
              <Route path="inventory" element={<Inventory />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
