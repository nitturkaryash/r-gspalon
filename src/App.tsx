import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import { DevRefresher } from './components/DevRefresher'
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { theme } from './theme'; // Your theme configuration
import React, { lazy, Suspense } from 'react';

// Regular imports for smaller pages
import Dashboard from './pages/Dashboard'
import Clients from './pages/Clients'
import Orders from './pages/Orders'
import Inventory from './pages/Inventory'
import CollectionDetail from './pages/CollectionDetail'
import ServiceCollections from './pages/ServiceCollections'
import ServiceCollectionDetail from './pages/ServiceCollectionDetail'

// Lazy load larger pages
const Appointments = lazy(() => import('./pages/Appointments'));
const Stylists = lazy(() => import('./pages/Stylists'));
const POS = lazy(() => import('./pages/POS'));

// Loading fallback component
const PageLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    Loading...
  </div>
);

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Layout>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/appointments" element={<Appointments />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/services" element={<ServiceCollections />} />
            <Route path="/services/:id" element={<ServiceCollectionDetail />} />
            <Route path="/stylists" element={<Stylists />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/pos" element={<POS />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/inventory/:id" element={<CollectionDetail />} />
          </Routes>
        </Suspense>
      </Layout>
      
      {/* Only renders in development */}
      <DevRefresher />
    </ThemeProvider>
  )
}

export default App
