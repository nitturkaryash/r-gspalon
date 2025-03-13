import { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import { supabase } from '../supabaseClient'
import { toast } from 'react-toastify'
import { Session, User, AuthError } from '@supabase/supabase-js';

// Context interface
interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component props
interface AuthProviderProps {
  children: ReactNode;
}

// Provider component
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    // Check for demo auth in localStorage
    const demoAuth = localStorage.getItem('salon_demo_auth');
    if (demoAuth) {
      try {
        const demoData = JSON.parse(demoAuth);
        if (demoData.isAuthenticated && demoData.user) {
          setUser(demoData.user as User);
          setIsLoading(false);
          return; // Skip Supabase auth if demo auth exists
        }
      } catch (err) {
        console.error('Error parsing demo auth:', err);
        localStorage.removeItem('salon_demo_auth');
      }
    }

    // Regular Supabase auth
    getSession().then(({ session }) => {
      setSession(session);
      setUser(session?.user || null);
      setIsLoading(false);
    });

    // Subscribe to auth changes
    const { data: { subscription } } = subscribeToAuthChanges((event, session) => {
      setSession(session);
      setUser(session?.user || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value = {
    isAuthenticated: !!user,
    isLoading,
    user,
    signIn: async (email: string, password: string) => {
      const result = await signInWithEmail(email, password);
      return { error: result.error as AuthError | null };
    },
    signUp: async (email: string, password: string) => {
      const result = await signUpWithEmail(email, password);
      return { error: result.error as AuthError | null };
    },
    signOut: async () => {
      // Clear demo auth if exists
      localStorage.removeItem('salon_demo_auth');
      
      const result = await signOutUser();
      return { error: result.error as AuthError | null };
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export async function signInWithEmail(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) throw error
    
    return { data, error: null }
  } catch (error) {
    console.error('Error signing in:', error)
    toast.error('Failed to sign in. Please check your credentials.')
    return { data: null, error }
  }
}

export async function signUpWithEmail(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    
    if (error) throw error
    
    toast.success('Check your email for the confirmation link!')
    return { data, error: null }
  } catch (error) {
    console.error('Error signing up:', error)
    toast.error('Failed to sign up. Please try again.')
    return { data: null, error }
  }
}

export async function signOutUser() {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    
    toast.success('Signed out successfully')
    return { error: null }
  } catch (error) {
    console.error('Error signing out:', error)
    toast.error('Failed to sign out')
    return { error }
  }
}

export async function getSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error
    
    return { session, error: null }
  } catch (error) {
    console.error('Error getting session:', error)
    return { session: null, error }
  }
}

// Hook to subscribe to auth changes
export function subscribeToAuthChanges(callback: (event: any, session: any) => void) {
  return supabase.auth.onAuthStateChange(callback)
} 