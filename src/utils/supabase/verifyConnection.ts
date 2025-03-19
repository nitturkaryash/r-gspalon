import { supabase, TABLES } from './supabaseClient';

// Define local connection status variables since the imports may not be available
let connectionStatus = 'initializing';
let connectionError: Error | null = null;

// Try to get the status from supabaseClient dynamically at runtime
try {
  // This will be executed at runtime when the module is loaded
  setTimeout(() => {
    // Using dynamic imports to avoid static import errors
    import('./supabaseClient').then(module => {
      if (module.connectionStatus) connectionStatus = module.connectionStatus;
      if (module.connectionError) connectionError = module.connectionError;
      console.log('Updated connection status from module:', connectionStatus);
    }).catch(err => {
      console.error('Error importing connection status:', err);
    });
  }, 0);
} catch (e) {
  console.log('Using fallback connection status variables');
}

// Helper type for error objects
interface ErrorWithMessage {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
  [key: string]: any;
}

/**
 * Verifies the connection to Supabase and checks if required tables exist
 * This can be used during application startup to validate database connectivity
 */
export const verifySupabaseConnection = async (): Promise<{
  connected: boolean;
  tables: Record<string, boolean>;
  error?: string;
  diagnostics?: any;
}> => {
  // Prepare diagnostics information
  const diagnostics = {
    connectionStatus,
    connectionError,
    jwToken: {
      provided: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
      length: import.meta.env.VITE_SUPABASE_ANON_KEY?.length || 0,
      format: import.meta.env.VITE_SUPABASE_ANON_KEY?.split('.').length === 3 ? 'valid' : 'invalid',
      parts: import.meta.env.VITE_SUPABASE_ANON_KEY?.split('.').length || 0
    },
    databaseUrl: {
      provided: !!import.meta.env.VITE_SUPABASE_URL,
      value: import.meta.env.VITE_SUPABASE_URL || ''
    },
    timestamp: new Date().toISOString(),
    attempts: [] as any[]
  };

  try {
    // First check: Simple query to any table
    const simpleCheckStart = Date.now();
    const firstAttempt = await runDiagnosticQuery('inventory_sales');
    diagnostics.attempts.push({
      type: 'simple_query',
      table: 'inventory_sales',
      duration: Date.now() - simpleCheckStart,
      result: firstAttempt
    });

    // If we have a JWT error, return immediately with diagnostic info
    const errorMsg = (firstAttempt.error as ErrorWithMessage)?.message || '';
    if (firstAttempt.error && 
        (errorMsg.includes('JWT') || 
         errorMsg.includes('JWS') ||
         errorMsg.includes('CompactDecodeError'))) {
      console.error('JWT Authentication Error:', firstAttempt.error);
      return {
        connected: false,
        tables: {},
        error: `Failed to connect to Supabase: ${errorMsg}`,
        diagnostics
      };
    }

    // Skip the RPC call that's causing the 401 error
    // Instead, if the first query was successful, consider the connection good
    if (!firstAttempt.error) {
      console.log('Connected to Supabase successfully');
    } else {
      // If the first query failed with a non-JWT error, return the error
      return {
        connected: false,
        tables: {},
        error: `Failed to connect to Supabase: ${errorMsg}`,
        diagnostics
      };
    }
    
    // Check if all required tables exist
    const tablesResult: Record<string, boolean> = {};
    
    // Get all table names from the TABLES object
    const tableNames = Object.values(TABLES);
    
    // Check each table
    for (const tableName of tableNames) {
      try {
        const { data, error, count } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });
          
        tablesResult[tableName] = !error;
        
        if (error) {
          console.error(`Table check error for ${tableName}:`, error.message);
        } else {
          console.log(`Table ${tableName} exists with ${count} records`);
        }
      } catch (err) {
        tablesResult[tableName] = false;
        console.error(`Exception checking table ${tableName}:`, err);
      }
    }
    
    return {
      connected: true,
      tables: tablesResult,
      diagnostics
    };
  } catch (error) {
    console.error('Failed to verify Supabase connection:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      connected: false,
      tables: {},
      error: errorMessage,
      diagnostics: {
        ...diagnostics,
        finalError: error
      }
    };
  }
};

/**
 * Helper function to run a diagnostic query on a table
 */
async function runDiagnosticQuery(tableName: string) {
  try {
    const { data, error, count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });
      
    return { data, error, count };
  } catch (err) {
    return { data: null, error: err, count: 0 };
  }
} 