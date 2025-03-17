import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useEffect, useState } from 'react';
import { Box, CircularProgress } from '@mui/material';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  // During development, we'll skip auth checks
  // const { isAuthenticated } = useAuth();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Short timeout to ensure smooth transition
    const timer = setTimeout(() => {
      setIsChecking(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  if (isChecking) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  // During development, we'll skip auth checks and always render children
  // if (!isAuthenticated) {
  //   console.log('Not authenticated, redirecting to login from:', location.pathname);
  //   return <Navigate to="/login" state={{ from: location }} replace />;
  // }

  return <>{children}</>;
} 