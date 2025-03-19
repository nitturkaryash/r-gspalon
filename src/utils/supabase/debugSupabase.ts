import { supabase } from './supabaseClient';
import { TABLES } from './supabaseClient';

// Define a type for table check results
type TableCheckResult = Record<string, boolean>;

/**
 * Utility to check Supabase connection and configuration
 * This can be used to debug connection issues
 */
export async function checkSupabaseConnection() {
  console.log('Checking Supabase connection...');
  
  try {
    // Use environment variables instead of accessing protected properties
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    console.log('Supabase URL:', supabaseUrl ? 'Set' : 'Missing');
    console.log('Supabase Key:', supabaseKey ? 'Set (length: ' + (supabaseKey?.length || 0) + ')' : 'Missing');
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase URL or Key is missing');
      return {
        connected: false,
        credentials: {
          url: supabaseUrl ? 'Set' : 'Missing',
          key: supabaseKey ? 'Set (length: ' + (supabaseKey?.length || 0) + ')' : 'Missing'
        },
        tables: {}
      };
    }
    
    // Test connection by checking a table
    const { data, error } = await supabase
      .from(TABLES.PURCHASES)
      .select('count(*)', { count: 'exact', head: true });
    
    const tablesCheck: TableCheckResult = {};
    
    // Check all tables
    for (const table of Object.values(TABLES)) {
      try {
        const { error } = await supabase
          .from(table)
          .select('count(*)', { count: 'exact', head: true });
        
        tablesCheck[table] = !error;
        
      } catch (e) {
        tablesCheck[table] = false;
      }
    }
    
    // Log the overall connection status
    const connected = !error;
    console.log('Connection status:', connected ? 'Connected' : 'Failed');
    console.log('Tables check:', tablesCheck);
    
    return {
      connected,
      credentials: {
        url: supabaseUrl ? 'Set' : 'Missing',
        key: supabaseKey ? 'Set (length: ' + (supabaseKey?.length || 0) + ')' : 'Missing'
      },
      tables: tablesCheck
    };
    
  } catch (error) {
    console.error('Error checking Supabase connection:', error);
    return {
      connected: false,
      credentials: {
        url: 'Error',
        key: 'Error'
      },
      tables: {}
    };
  }
}

/**
 * Checks if the current user is authenticated
 */
export const checkSupabaseAuth = async (): Promise<{
  authenticated: boolean;
  user: any | null;
  message: string;
}> => {
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
  } catch (error) {
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
export const debugSupabase = async (): Promise<{
  connection: any;
  auth: any;
  tables: any;
  success: boolean;
}> => {
  const connection = await checkSupabaseConnection();
  const auth = await checkSupabaseAuth();
  
  // Check for specific tables
  const tablesCheck: TableCheckResult = {
    inventory_purchases: false,
    inventory_sales: false,
    inventory_consumption: false,
    inventory_balance_stock: false
  };
  
  try {
    // Check each table
    for (const table of Object.keys(tablesCheck)) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        tablesCheck[table] = !error;
      } catch (e) {
        console.error(`Error checking table ${table}:`, e);
        tablesCheck[table] = false;
      }
    }
  } catch (e) {
    console.error('Error checking tables:', e);
  }
  
  return {
    connection,
    auth,
    tables: tablesCheck,
    success: connection.connected && auth.authenticated && Object.values(tablesCheck).some(exists => exists)
  };
};

/**
 * Checks Supabase connection and configuration
 * For debugging purposes only
 */
export const debugSupabaseConnection = async () => {
  try {
    // We can't access protected properties directly
    // Instead of accessing supabase.supabaseUrl, check environment variables
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    console.log('Supabase URL:', supabaseUrl ? 'Set' : 'Missing');
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return {
        status: 'error',
        message: 'Missing Supabase environment variables',
        config: {
          url: supabaseUrl ? 'Set' : 'Missing',
          key: supabaseAnonKey ? `Set (length: ${supabaseAnonKey.length})` : 'Missing'
        }
      };
    }

    // Try to make a simple query to check connectivity
    const { data: versionData, error: versionError } = await supabase.rpc('get_service_status');
    
    const connectionStatus = !versionError ? 'connected' : 'error';
    
    // Test tables
    const tablesCheck: TableCheckResult = {
      inventory_purchases: false,
      inventory_sales: false,
      inventory_consumption: false,
      inventory_balance_stock: false
    };
    
    // Check if each table exists
    const tableNames = Object.keys(tablesCheck);
    
    for (const table of tableNames) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        // Type-safe assignment using string index signature
        tablesCheck[table] = !error;
      } catch (err) {
        tablesCheck[table] = false;
      }
    }
    
    return {
      status: connectionStatus,
      url: supabaseUrl,
      tables: tablesCheck,
      error: versionError ? versionError.message : null
    };
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}; 