import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth.tsx';
import { Box, CircularProgress } from '@mui/material';

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const [isDemoAuth, setIsDemoAuth] = useState(false);
  const [checkingDemoAuth, setCheckingDemoAuth] = useState(true);

  useEffect(() => {
    // Check for demo auth in localStorage
    const demoAuth = localStorage.getItem('salon_demo_auth');
    if (demoAuth) {
      try {
        const demoData = JSON.parse(demoAuth);
        if (demoData.isAuthenticated) {
          setIsDemoAuth(true);
        }
      } catch (err) {
        console.error('Error parsing demo auth:', err);
      }
    }
    setCheckingDemoAuth(false);
  }, []);

  // Show loading spinner while checking authentication
  if (isLoading || checkingDemoAuth) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh' 
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Redirect to login if not authenticated (but allow demo auth)
  if (!isAuthenticated && !isDemoAuth) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Render children if authenticated
  return <>{children}</>;
} 