import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Layout from './components/Layout';
import Login from './pages/Login';
import PageLoader from './components/PageLoader';
import { theme } from './theme';
import { AuthProvider } from './lib/auth.tsx';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import Inventory from './pages/Inventory';

// Lazy-loaded components for better performance
const Appointments = lazy(() => import('./pages/Appointments'));
const Clients = lazy(() => import('./pages/Clients'));
const Stylists = lazy(() => import('./pages/Stylists'));
const ServiceCollections = lazy(() => import('./pages/ServiceCollections'));
const ServiceCollectionDetail = lazy(() => import('./pages/ServiceCollectionDetail'));
const Orders = lazy(() => import('./pages/Orders'));
const POS = lazy(() => import('./pages/POS'));
const CollectionDetail = lazy(() => import('./pages/CollectionDetail'));
const InventoryExportPage = lazy(() => import('./pages/InventoryExportPage'));

function App() {
  return (
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
        <Route path="stylists" element={
          <Suspense fallback={<PageLoader />}>
            <Stylists />
          </Suspense>
        } />
        <Route path="services" element={
          <Suspense fallback={<PageLoader />}>
            <ServiceCollections />
          </Suspense>
        } />
        <Route path="services/:id" element={
          <Suspense fallback={<PageLoader />}>
            <ServiceCollectionDetail />
          </Suspense>
        } />
        <Route path="orders" element={
          <Suspense fallback={<PageLoader />}>
            <Orders />
          </Suspense>
        } />
        <Route path="pos" element={
          <Suspense fallback={<PageLoader />}>
            <POS />
          </Suspense>
        } />
        <Route path="members" element={<Members />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="inventory/export" element={
          <Suspense fallback={<PageLoader />}>
            <InventoryExportPage />
          </Suspense>
        } />
        <Route path="inventory/:id" element={
          <Suspense fallback={<PageLoader />}>
            <CollectionDetail />
          </Suspense>
        } />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
