/**
 * Utility to check Supabase connection and configuration
 * This can be used to debug connection issues
 */
export declare const checkSupabaseConnection: () => Promise<{
    success: boolean;
    message: string;
    details?: any;
}>;
/**
 * Checks if the current user is authenticated
 */
export declare const checkSupabaseAuth: () => Promise<{
    authenticated: boolean;
    user: any | null;
    message: string;
}>;
/**
 * Comprehensive check of Supabase setup
 */
export declare const debugSupabase: () => Promise<{
    connection: any;
    auth: any;
    tables: any;
    success: boolean;
}>;
