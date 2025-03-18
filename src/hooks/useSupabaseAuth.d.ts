/**
 * Custom hook for managing Supabase authentication
 * Provides functions for refreshing session and handling auth errors
 */
export declare function useSupabaseAuth(): {
    isRefreshing: boolean;
    refreshSession: () => Promise<import("@supabase/auth-js").Session>;
    handleAuthError: (error: unknown) => string;
};
