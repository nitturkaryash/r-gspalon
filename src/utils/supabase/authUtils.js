import { supabase } from './supabaseClient';
import { toast } from 'react-toastify';
/**
 * Checks if the user is authenticated and returns the user object
 * Throws an error if not authenticated
 */
export const checkAuthentication = async () => {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
            console.error('Authentication error:', error);
            toast.error(`Authentication error: ${error.message}`);
            throw new Error(`Authentication error: ${error.message}`);
        }
        if (!user) {
            const errorMsg = 'User is not authenticated. Please log in again.';
            toast.error(errorMsg);
            throw new Error(errorMsg);
        }
        return user;
    }
    catch (error) {
        console.error('Error checking authentication:', error);
        if (error instanceof Error) {
            toast.error(error.message);
        }
        else {
            toast.error('Authentication error occurred');
        }
        throw error;
    }
};
/**
 * Refreshes the user's session
 * Returns the session data if successful, throws an error otherwise
 */
export const refreshSession = async () => {
    try {
        console.log('Attempting to refresh session...');
        const { data, error } = await supabase.auth.refreshSession();
        if (error) {
            console.error('Error refreshing session:', error);
            toast.error(`Session refresh failed: ${error.message}`);
            throw new Error(`Failed to refresh session: ${error.message}`);
        }
        if (!data.session) {
            const errorMsg = 'No valid session found. Please log in again.';
            console.error(errorMsg);
            toast.error(errorMsg);
            throw new Error(errorMsg);
        }
        console.log('Session refreshed successfully');
        return data.session;
    }
    catch (error) {
        console.error('Error in refreshSession:', error);
        if (!(error instanceof Error)) {
            throw new Error('Unknown error refreshing session');
        }
        throw error;
    }
};
/**
 * Utility function to handle authentication errors
 * Redirects to login page after showing an error message
 */
export const handleAuthError = (error) => {
    console.error('Authentication error:', error);
    let errorMessage = 'Authentication error occurred';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    toast.error(`Authentication error: ${errorMessage}`);
    // Redirect to login page after a short delay
    setTimeout(() => {
        window.location.href = '/login';
    }, 2000);
    return errorMessage;
};
