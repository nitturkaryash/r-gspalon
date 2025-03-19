import { supabase } from './supabaseClient';
/**
 * Utility to check Supabase connection and configuration
 * This can be used to debug connection issues
 */
export const checkSupabaseConnection = async () => {
    try {
        console.log('Checking Supabase connection...');
        console.log('Supabase URL:', supabase.supabaseUrl);
        // Check if we have a valid URL and key
        if (!supabase.supabaseUrl || !supabase.supabaseKey) {
            return {
                success: false,
                message: 'Missing Supabase URL or key',
                details: {
                    url: supabase.supabaseUrl ? 'Set' : 'Missing',
                    key: supabase.supabaseKey ? 'Set (length: ' + supabase.supabaseKey.length + ')' : 'Missing'
                }
            };
        }
        // Try to make a simple query to check connection
        const start = Date.now();
        const { data, error } = await supabase.from('_test_connection').select('*').limit(1).maybeSingle();
        const duration = Date.now() - start;
        if (error) {
            // This error is expected since the table doesn't exist
            // But we can check if it's a connection error or just a table not found error
            if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
                // This is actually good - it means we connected but the table doesn't exist
                return {
                    success: true,
                    message: 'Successfully connected to Supabase',
                    details: {
                        duration: `${duration}ms`,
                        error: 'Table not found (expected)',
                        auth: 'Connection successful'
                    }
                };
            }
            // If it's a different error, it might be a connection issue
            return {
                success: false,
                message: `Connection error: ${error.message}`,
                details: {
                    duration: `${duration}ms`,
                    error,
                    code: error.code
                }
            };
        }
        // If we get here, somehow the _test_connection table exists
        return {
            success: true,
            message: 'Successfully connected to Supabase',
            details: {
                duration: `${duration}ms`,
                data,
                note: 'Unexpected: _test_connection table exists'
            }
        };
    }
    catch (error) {
        return {
            success: false,
            message: `Failed to check Supabase connection: ${error instanceof Error ? error.message : 'Unknown error'}`,
            details: { error }
        };
    }
};
/**
 * Checks if the current user is authenticated
 */
export const checkSupabaseAuth = async () => {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
            return {
                authenticated: false,
                user: null,
                message: `Auth error: ${error.message}`
            };
        }
        if (!user) {
            return {
                authenticated: false,
                user: null,
                message: 'No user is currently authenticated'
            };
        }
        return {
            authenticated: true,
            user,
            message: `Authenticated as ${user.email}`
        };
    }
    catch (error) {
        return {
            authenticated: false,
            user: null,
            message: `Failed to check authentication: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
    }
};
/**
 * Comprehensive check of Supabase setup
 */
export const debugSupabase = async () => {
    const connection = await checkSupabaseConnection();
    const auth = await checkSupabaseAuth();
    // Check for specific tables
    const tablesCheck = {
        inventory_purchases: false,
        inventory_sales: false,
        inventory_consumption: false,
        inventory_balance_stock: false
    };
    try {
        // Check each table
        for (const table of Object.keys(tablesCheck)) {
            try {
                const { error } = await supabase
                    .from(table)
                    .select('count(*)', { count: 'exact', head: true });
                tablesCheck[table] = !error;
            }
            catch (e) {
                console.error(`Error checking table ${table}:`, e);
                tablesCheck[table] = false;
            }
        }
    }
    catch (e) {
        console.error('Error checking tables:', e);
    }
    return {
        connection,
        auth,
        tables: tablesCheck,
        success: connection.success && auth.authenticated && Object.values(tablesCheck).some(exists => exists)
    };
};
