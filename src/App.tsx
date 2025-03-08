import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import { DevRefresher } from './components/DevRefresher'
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { theme } from './theme'; // Your theme configuration

// Page imports
import Dashboard from './pages/Dashboard'
import Appointments from './pages/Appointments'
import Clients from './pages/Clients'
import Stylists from './pages/Stylists'
import Orders from './pages/Orders'
import POS from './pages/POS'
import Inventory from './pages/Inventory'
import CollectionDetail from './pages/CollectionDetail'
import ServiceCollections from './pages/ServiceCollections'
import ServiceCollectionDetail from './pages/ServiceCollectionDetail'

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Layout>
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
      </Layout>
      
      {/* Only renders in development */}
      <DevRefresher />
    </ThemeProvider>
  )
}

export default App
