import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface AuthUser {
  id: string;
  username: string;
  role: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: AuthUser | null;
  login: (credentials: { username: string; password: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const AUTH_TOKEN_KEY = 'auth_token';
const AUTH_USER_KEY = 'auth_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      const savedUser = localStorage.getItem(AUTH_USER_KEY);

      if (token && savedUser) {
        try {
          setUser(JSON.parse(savedUser));
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Auth initialization error:', error);
          localStorage.removeItem(AUTH_TOKEN_KEY);
          localStorage.removeItem(AUTH_USER_KEY);
          navigate('/login', { replace: true });
        }
      }
    };

    initAuth();
  }, [navigate]);

  const login = async (credentials: { username: string; password: string }) => {
    try {
      // Query the auth table to verify credentials
      const { data: user, error } = await supabase
        .from('auth')
        .select('id, username, role, password_hash')
        .eq('username', credentials.username)
        .eq('is_active', true)
        .single();

      if (error || !user) {
        console.error('Login error:', error);
        throw new Error('Invalid credentials');
      }

      // Direct password comparison for testing
      // In production, you should use proper password hashing
      if (user.password_hash !== credentials.password) {
        throw new Error('Invalid credentials');
      }

      // Update last login timestamp
      await supabase
        .from('auth')
        .update({ last_login: new Date().toISOString() })
        .eq('id', user.id);

      const authUser: AuthUser = {
        id: user.id,
        username: user.username,
        role: user.role,
      };

      // Store auth data
      localStorage.setItem(AUTH_TOKEN_KEY, 'dummy-token-' + Date.now());
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(authUser));
      
      setUser(authUser);
      setIsAuthenticated(true);

      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    } catch (error) {
      console.error('Login error:', error);
      throw new Error('Invalid credentials');
    }
  };

  const logout = async () => {
    try {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(AUTH_USER_KEY);
      setUser(null);
      setIsAuthenticated(false);
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
    }
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