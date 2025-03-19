/**
 * Checks if the user is authenticated and returns the user object
 * Throws an error if not authenticated
 */
export declare const checkAuthentication: () => Promise<import("@supabase/auth-js").User>;
/**
 * Refreshes the user's session
 * Returns the session data if successful, throws an error otherwise
 */
export declare const refreshSession: () => Promise<import("@supabase/auth-js").Session>;
/**
 * Utility function to handle authentication errors
 * Redirects to login page after showing an error message
 */
export declare const handleAuthError: (error: unknown) => string;
