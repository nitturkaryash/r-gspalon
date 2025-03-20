import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { CssBaseline, ThemeProvider as MuiThemeProvider, createTheme, Box } from '@mui/material';
import Layout from './components/Layout';
import { DevRefresher } from './components/DevRefresher';
import Login from './pages/Login';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { CircularProgress } from '@mui/material';
import { AuthProvider } from './hooks/useAuth'; // Using the hook-based auth from main
import ProtectedRoute from './components/ProtectedRoute';
import { Global, css } from '@emotion/react';

// Define a simple theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#6B8E23', // Olive green
      light: '#8FB03E',
      dark: '#566E1C',
    },
    secondary: {
      main: '#D2B48C', // Tan/beige
      light: '#E6D5B8',
      dark: '#A89072',
    },
    background: {
      default: '#F5F5F0', // Off-white
      paper: '#FFFFFF',
    },
    text: {
      primary: '#333333',
      secondary: '#666666',
    },
    salon: {
      olive: '#6B8E23', // Matching primary main color
    }
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: 14,
    fontWeightLight: 300,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 700,
  },
  shape: {
    borderRadius: 8, // Add subtle rounded corners to all components
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          boxShadow: '0px 3px 6px rgba(0, 0, 0, 0.1)',
          boxSizing: 'border-box',
          maxWidth: '100%'
        }
      }
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          width: '100%',
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '16px',
          boxSizing: 'border-box',
        }
      }
    },
    MuiBox: {
      styleOverrides: {
        root: {
          boxSizing: 'border-box',
          maxWidth: '100%'
        }
      }
    },
    MuiGrid: {
      styleOverrides: {
        container: {
          width: '100%',
          margin: 0,
          padding: 0,
          boxSizing: 'border-box'
        },
        item: {
          boxSizing: 'border-box'
        }
      }
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          width: '100%',
          overflowX: 'auto',
          borderRadius: '8px'
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          width: '100%',
          boxSizing: 'border-box'
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-notchedOutline': {
            borderRadius: 8,
          },
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          letterSpacing: '0.01em',
        },
      },
    },
  },
});

// Custom ThemeProvider with global styles
const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <MuiThemeProvider theme={theme}>
      <Global
        styles={css`
          html, body, #root {
            height: 100%;
            width: 100%;
            margin: 0;
            padding: 0;
            overflow: auto;
          }
          
          * {
            box-sizing: border-box;
            max-width: 100%;
          }
          
          .content-container {
            max-width: 1400px;
            width: 100%;
            margin: 0 auto;
            padding: 16px;
            box-sizing: border-box;
            overflow: visible;
          }
          
          /* Reset any zoom or scale transformations */
          body {
            zoom: 1 !important;
            -webkit-text-size-adjust: 100%;
            transform: none !important;
          }
          
          /* Make tables responsive */
          table {
            width: 100%;
            border-collapse: collapse;
          }
          
          /* Ensure form elements don't overflow */
          input, select, textarea {
            max-width: 100%;
          }
        `}
      />
      {children}
    </MuiThemeProvider>
  );
};

// Eagerly loaded pages
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import Inventory from './pages/Inventory';

// Lazy-loaded components
const Appointments = lazy(() => import('./pages/Appointments'));
const Clients = lazy(() => import('./pages/Clients'));
const Stylists = lazy(() => import('./pages/Stylists'));
const ServiceCollections = lazy(() => import('./pages/ServiceCollections'));
const ServiceCollectionDetail = lazy(() => import('./pages/ServiceCollectionDetail'));
const ProductCollections = lazy(() => import('./pages/ProductCollections'));
const ProductCollectionDetail = lazy(() => import('./pages/ProductCollectionDetail'));
const Orders = lazy(() => import('./pages/Orders'));
const POS = lazy(() => import('./pages/POS'));
const CollectionDetail = lazy(() => import('./pages/CollectionDetail'));

// Loading fallback component
const PageLoader = () => (
  <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
    <CircularProgress />
  </Box>
);

function App() {
  return (
    <ThemeProvider>
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
            <Route path="stylists" element={<Stylists />} />
            <Route path="services" element={<ServiceCollections />} />
            <Route path="services/:id" element={<ServiceCollectionDetail />} />
            <Route path="products" element={<ProductCollections />} />
            <Route path="products/:id" element={<ProductCollectionDetail />} />
            <Route path="members" element={<Members />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="orders" element={<Orders />} />
            <Route path="pos" element={<POS />} />
            <Route path="collections/:id" element={<CollectionDetail />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
      
      {/* Only renders in development */}
      <DevRefresher />
    </ThemeProvider>
  );
}

export default App;