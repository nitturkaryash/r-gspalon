import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { LoginCredentials } from '../models/adminTypes';
import { useNavigate, useLocation } from 'react-router-dom';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  user: { username: string } | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Hardcoded admin credentials - in a real app, these would be stored securely in a database
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123' // In production, use hashed passwords
};

// Authentication storage keys
const AUTH_TOKEN_KEY = 'auth_token';
const AUTH_USER_KEY = 'auth_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<{ username: string } | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Initialize auth state from storage
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      const storedUser = localStorage.getItem(AUTH_USER_KEY);
      
      if (token && storedUser) {
        setIsAuthenticated(true);
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          // If parsing fails, clear invalid data
          localStorage.removeItem(AUTH_TOKEN_KEY);
          localStorage.removeItem(AUTH_USER_KEY);
          setIsAuthenticated(false);
          setUser(null);
        }
      } else {
        setIsAuthenticated(false);
        setUser(null);
        
        // Only redirect to login if not already there
        if (location.pathname !== '/login') {
          navigate('/login', { replace: true });
        }
      }
    };
    
    checkAuth();
  }, [navigate, location.pathname]);

  const login = async (credentials: LoginCredentials) => {
    // In a real app, this would be an API call to validate credentials
    if (
      credentials.username === ADMIN_CREDENTIALS.username &&
      credentials.password === ADMIN_CREDENTIALS.password
    ) {
      // Create a mock token (in a real app, this would come from the server)
      const mockToken = btoa(JSON.stringify({ username: credentials.username, time: new Date().getTime() }));
      
      // Store auth data
      localStorage.setItem(AUTH_TOKEN_KEY, mockToken);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify({ username: credentials.username }));
      
      // Update state
      setIsAuthenticated(true);
      setUser({ username: credentials.username });
      
      // Redirect to dashboard or intended page
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    } else {
      throw new Error('Invalid credentials');
    }
  };

  const logout = () => {
    // Clear auth data
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    
    // Update state
    setIsAuthenticated(false);
    setUser(null);
    
    // Redirect to login
    navigate('/login', { replace: true });
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 