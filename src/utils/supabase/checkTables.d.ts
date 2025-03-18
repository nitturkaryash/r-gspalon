/**
 * Utility to check if required tables exist in Supabase
 * This will help diagnose connection and table issues
 */
export declare const checkSupabaseTables: () => Promise<{
    success: boolean;
    tables: Record<string, boolean>;
    error?: string;
}>;
/**
 * Utility to get sample data from tables
 */
export declare const getSampleData: () => Promise<{
    collections?: any[];
    products?: any[];
    error?: string;
}>;
