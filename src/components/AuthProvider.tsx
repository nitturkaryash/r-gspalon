import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../utils/supabase/supabaseClient';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import { toast } from 'react-toastify';

// Define the auth context type
type AuthContextType = {
  user: any | null;
  session: any | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
};

// Create the auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Function to refresh the session
  const refreshSession = async () => {
    try {
      console.log('Refreshing session...');
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('Error refreshing session:', error);
        throw error;
      }
      
      if (data && data.session) {
        console.log('Session refreshed successfully');
        setSession(data.session);
        setUser(data.user);
        return;
      }
      
      // If we get here with no error but no session, user needs to log in
      console.log('No session found during refresh');
      setSession(null);
      setUser(null);
      
      // Only redirect if we're not already on the login page
      if (location.pathname !== '/login') {
        toast.error('Your session has expired. Please log in again.');
        navigate('/login');
      }
    } catch (error) {
      console.error('Failed to refresh session:', error);
      setSession(null);
      setUser(null);
      
      // Only redirect if we're not already on the login page
      if (location.pathname !== '/login') {
        toast.error('Authentication error. Please log in again.');
        navigate('/login');
      }
    }
  };

  // Function to sign out
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Error signing out. Please try again.');
    }
  };

  // Check auth status on mount and set up auth state listener
  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      try {
        // Get current session
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (currentSession) {
          setSession(currentSession);
          
          // Get user data
          const { data: { user: currentUser } } = await supabase.auth.getUser();
          setUser(currentUser);
        } else {
          // No session, try to refresh
          await refreshSession();
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        // If we're not on the login page, redirect
        if (location.pathname !== '/login') {
          toast.error('Authentication error. Please log in again.');
          navigate('/login');
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (event === 'SIGNED_OUT') {
          navigate('/login');
        } else if (event === 'SIGNED_IN') {
          // Redirect to the intended path or dashboard
          const intendedPath = localStorage.getItem('intendedPath') || '/';
          localStorage.removeItem('intendedPath');
          navigate(intendedPath);
        }
      }
    );

    // Set up interval to refresh session every 10 minutes
    const intervalId = setInterval(() => {
      if (session) {
        refreshSession().catch(error => {
          console.error('Error in refresh interval:', error);
        });
      }
    }, 10 * 60 * 1000); // 10 minutes

    return () => {
      authListener.subscription.unsubscribe();
      clearInterval(intervalId);
    };
  }, [navigate, location.pathname]);

  // Provide the auth context value
  const value = {
    user,
    session,
    isLoading,
    signOut,
    refreshSession,
  };

  // Show loading indicator while checking auth
  if (isLoading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          flexDirection: 'column',
          gap: 2
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// HOC to protect routes
export const withAuth = (Component: React.ComponentType<any>) => {
  const WithAuth = (props: any) => {
    const { user, isLoading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
      if (!isLoading && !user) {
        // Save the intended path
        localStorage.setItem('intendedPath', location.pathname);
        navigate('/login');
      }
    }, [user, isLoading, navigate, location.pathname]);

    if (isLoading) {
      return (
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100vh',
            flexDirection: 'column',
            gap: 2
          }}
        >
          <CircularProgress />
        </Box>
      );
    }

    if (!user) {
      return <Navigate to="/login" />;
    }

    return <Component {...props} />;
  };

  return WithAuth;
}; 