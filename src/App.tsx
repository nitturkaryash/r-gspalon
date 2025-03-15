import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import Layout from './components/Layout';
import Login from './pages/Login';
import { theme } from './theme';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { CircularProgress, Box } from '@mui/material';
import { AuthProvider, withAuth } from './components/AuthProvider';

// Lazy load components
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Orders = lazy(() => import('./pages/Orders'));
const ServiceCollections = lazy(() => import('./pages/ServiceCollections'));
const ServiceCollectionDetail = lazy(() => import('./pages/ServiceCollectionDetail'));
const Stylists = lazy(() => import('./pages/Stylists'));
const Clients = lazy(() => import('./pages/Clients'));
const Appointments = lazy(() => import('./pages/Appointments'));
const Inventory = lazy(() => import('./pages/Inventory'));
const InventorySetup = lazy(() => import('./pages/InventorySetup'));
const ProductCollections = lazy(() => import('./pages/ProductCollections'));
const ProductCollectionDetail = lazy(() => import('./pages/ProductCollectionDetail'));
const ProductSetup = lazy(() => import('./pages/ProductSetup'));
const POS = lazy(() => import('./pages/POS'));
const Members = lazy(() => import('./pages/Members'));

// Apply auth protection to routes
const ProtectedDashboard = withAuth(Dashboard);
const ProtectedOrders = withAuth(Orders);
const ProtectedServiceCollections = withAuth(ServiceCollections);
const ProtectedServiceCollectionDetail = withAuth(ServiceCollectionDetail);
const ProtectedStylists = withAuth(Stylists);
const ProtectedClients = withAuth(Clients);
const ProtectedAppointments = withAuth(Appointments);
const ProtectedInventory = withAuth(Inventory);
const ProtectedInventorySetup = withAuth(InventorySetup);
const ProtectedProductCollections = withAuth(ProductCollections);
const ProtectedProductCollectionDetail = withAuth(ProductCollectionDetail);
const ProtectedProductSetup = withAuth(ProductSetup);
const ProtectedPOS = withAuth(POS);
const ProtectedMembers = withAuth(Members);

// Loading fallback component
const LoadingFallback = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <CircularProgress />
  </Box>
);

// Add a global error handler for Supabase
const handleSupabaseError = (error: any) => {
  console.error('Supabase error:', error);
  
  // Check if it's an authentication error
  if (error?.status === 401 || error?.message?.includes('auth')) {
    toast.error('Authentication error. Please log in again.');
  } else {
    toast.error(`Database error: ${error?.message || 'Unknown error'}`);
  }
};

function App() {
  // Add effect to set up global error handler
  React.useEffect(() => {
    // Add global error handler
    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason;
      if (error?.status === 401 || error?.message?.includes('auth')) {
        handleSupabaseError(error);
      }
    });
    
    return () => {
      window.removeEventListener('unhandledrejection', () => {});
    };
  }, []);
  
  return (
    <Router>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <ToastContainer position="top-right" theme="dark" />
        <AuthProvider>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<Layout />}>
                <Route index element={<ProtectedDashboard />} />
                <Route path="dashboard" element={<ProtectedDashboard />} />
                <Route path="orders" element={<ProtectedOrders />} />
                <Route path="services" element={<ProtectedServiceCollections />} />
                <Route path="services/:id" element={<ProtectedServiceCollectionDetail />} />
                <Route path="stylists" element={<ProtectedStylists />} />
                <Route path="clients" element={<ProtectedClients />} />
                <Route path="appointments" element={<ProtectedAppointments />} />
                <Route path="inventory" element={<ProtectedInventory />} />
                <Route path="inventory-setup" element={<ProtectedInventorySetup />} />
                <Route path="products" element={<ProtectedProductCollections />} />
                <Route path="products/:id" element={<ProtectedProductCollectionDetail />} />
                <Route path="products-setup" element={<ProtectedProductSetup />} />
                <Route path="pos" element={<ProtectedPOS />} />
                <Route path="members" element={<ProtectedMembers />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </Suspense>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;