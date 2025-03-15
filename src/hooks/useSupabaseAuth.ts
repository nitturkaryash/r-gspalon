import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabase/supabaseClient';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

/**
 * Custom hook for managing Supabase authentication
 * Provides functions for refreshing session and handling auth errors
 */
export function useSupabaseAuth() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const navigate = useNavigate();

  /**
   * Refresh the user's session
   * @returns The session data if successful
   */
  const refreshSession = useCallback(async () => {
    // Don't refresh if we've refreshed in the last minute
    if (lastRefreshed && (new Date().getTime() - lastRefreshed.getTime() < 60000)) {
      console.log('Session was refreshed recently, skipping');
      return;
    }
    
    setIsRefreshing(true);
    try {
      console.log('Refreshing Supabase session...');
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('Error refreshing session:', error);
        throw error;
      }
      
      if (!data.session) {
        throw new Error('No valid session found. Please log in again.');
      }
      
      console.log('Session refreshed successfully');
      setLastRefreshed(new Date());
      return data.session;
    } catch (error) {
      console.error('Failed to refresh session:', error);
      throw error;
    } finally {
      setIsRefreshing(false);
    }
  }, [lastRefreshed]);

  /**
   * Handle authentication errors
   * Shows an error toast and redirects to login
   */
  const handleAuthError = useCallback((error: unknown) => {
    console.error('Authentication error:', error);
    
    let errorMessage = 'Authentication error occurred';
    
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    toast.error(`Authentication error: ${errorMessage}`);
    
    // Redirect to login page after a short delay
    setTimeout(() => {
      navigate('/login');
    }, 2000);
    
    return errorMessage;
  }, [navigate]);

  // Refresh session on mount
  useEffect(() => {
    refreshSession().catch(error => {
      // Only handle auth errors, let other errors propagate
      if (error instanceof Error && 
          (error.message.includes('auth') || 
           error.message.includes('session') || 
           error.message.includes('log in'))) {
        handleAuthError(error);
      }
    });
    
    // Set up interval to refresh session every 10 minutes
    const intervalId = setInterval(() => {
      refreshSession().catch(error => {
        console.error('Error in refresh interval:', error);
        // Don't redirect on interval errors
      });
    }, 10 * 60 * 1000); // 10 minutes
    
    return () => clearInterval(intervalId);
  }, [refreshSession, handleAuthError]);

  return {
    isRefreshing,
    refreshSession,
    handleAuthError
  };
} 