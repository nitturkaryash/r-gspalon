import React, { createContext, useContext, useState, ReactNode } from 'react';
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

// Constants for auth storage
const AUTH_TOKEN_KEY = 'auth_token';
const AUTH_USER_KEY = 'auth_user';

// Provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize auth state from localStorage
  React.useEffect(() => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    const savedUser = localStorage.getItem(AUTH_USER_KEY);

    if (token && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        setSession({ token });
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  // Function to refresh the session (development mode stub)
  const refreshSession = async () => {
    console.log('DEV MODE: Refreshing session (no-op)');
    
    // In development mode, just ensure we have a user
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    const savedUser = localStorage.getItem(AUTH_USER_KEY);
    
    if (!token || !savedUser) {
      // If no user, create one
      const dummyUser = {
        id: 'dev-user-id',
        username: 'admin',
        role: 'admin',
      };
      
      localStorage.setItem(AUTH_TOKEN_KEY, 'dummy-token-' + Date.now());
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(dummyUser));
      
      setUser(dummyUser);
      setSession({ token: 'dummy-token-' + Date.now() });
      
      toast.info('Development mode: Session refreshed');
    }
    
    return Promise.resolve();
  };

  // Function to sign out
  const signOut = async () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    setUser(null);
    setSession(null);
    window.location.href = '/login';
  };

  // Provide the auth context value
  const value = {
    user,
    session,
    isLoading,
    signOut,
    refreshSession,
  };

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