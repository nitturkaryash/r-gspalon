import { useEffect } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

// Constants for auth storage
const AUTH_TOKEN_KEY = 'auth_token';
const AUTH_USER_KEY = 'auth_user';

export default function Login() {
  const navigate = useNavigate();

  // Development bypass - immediately redirect to dashboard
  useEffect(() => {
    // Set up custom auth
    const dummyUser = {
      id: 'dev-user-id',
      username: 'admin',
      role: 'admin',
    };
    
    localStorage.setItem(AUTH_TOKEN_KEY, 'dummy-token-' + Date.now());
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(dummyUser));
    
    // Show success message and redirect
    toast.success('Development mode: Auto-login successful');
    
    // Redirect to dashboard
    navigate('/dashboard', { replace: true });
  }, [navigate]);

  // Show loading indicator while redirecting
  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
      <CircularProgress />
      <Typography variant="body1" sx={{ ml: 2 }}>
        Development mode: Redirecting to dashboard...
      </Typography>
    </Box>
  );
} 