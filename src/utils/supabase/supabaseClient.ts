import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

// Global variable to track connection status and error for diagnostics
export let connectionStatus = 'initializing';
export let connectionError: Error | null = null;

// Function to validate JWT token format
const validateJwtFormat = (token: string): boolean => {
  if (!token) return false;
  
  // JWT should have 3 parts separated by dots
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  
  // Each part should be base64url encoded
  for (const part of parts) {
    if (!/^[A-Za-z0-9_-]+$/g.test(part)) return false;
  }
  
  return true;
};

// Get environment variables for Supabase
let supabaseUrl = '';
let supabaseAnonKey = '';

// Try different environment variable formats (Vite, Next.js, etc.)
if (import.meta.env.VITE_SUPABASE_URL) {
  supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
} else if (import.meta.env.NEXT_PUBLIC_SUPABASE_URL) {
  supabaseUrl = import.meta.env.NEXT_PUBLIC_SUPABASE_URL as string;
}

if (import.meta.env.VITE_SUPABASE_ANON_KEY) {
  supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
} else if (import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  supabaseAnonKey = import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
}

console.log('=========================================');
console.log('Supabase Connection Initialization');
console.log('=========================================');
console.log(`URL detected: ${supabaseUrl ? 'Yes (' + supabaseUrl + ')' : 'No'}`);
console.log(`Key detected: ${supabaseAnonKey ? 'Yes (length: ' + supabaseAnonKey.length + ')' : 'No'}`);

// Check JWT token format
if (supabaseAnonKey) {
  const parts = supabaseAnonKey.split('.');
  console.log(`JWT token parts: ${parts.length} (should be 3)`);
  console.log(`JWT token format valid: ${validateJwtFormat(supabaseAnonKey)}`);
  if (parts.length === 3) {
    try {
      // Try to decode the payload (middle part)
      const payload = JSON.parse(atob(parts[1]));
      console.log("JWT payload:", payload);
    } catch (err) {
      console.error("Error decoding JWT payload:", err);
    }
  }
}

// Clean the key very aggressively
let cleanedSupabaseUrl = supabaseUrl ? supabaseUrl.trim() : 'https://cpkxkoosykyahuezxela.supabase.co';
let cleanedSupabaseAnonKey = '';

if (supabaseAnonKey) {
  // Remove ALL whitespace, quotes, and non-essential characters
  cleanedSupabaseAnonKey = supabaseAnonKey.replace(/[\s\n\r"'`]/g, '');
  
  // Check if it has the correct format (3 parts separated by periods)
  const parts = cleanedSupabaseAnonKey.split('.');
  console.log(`JWT token parts after cleaning: ${parts.length} (should be 3)`);
  
  if (parts.length !== 3) {
    console.error(`JWT token format error: Expected 3 parts, got ${parts.length}`);
    
    // Use a valid format fallback key that works with the same project
    // This is a demo key for cpkxkoosykyahuezxela Supabase project
    cleanedSupabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwa3hrb29zeWt5YWh1ZXp4ZWxhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAxMzQ0NzcsImV4cCI6MjA1NTcxMDQ3N30.R0MaAaqVFMLObwnMVz-eghsKb_HYDWhCOAeFrQcw8e0';
    
    connectionStatus = 'using-fallback-token';
    connectionError = new Error(`Invalid JWT format (${parts.length} parts), using fallback`);
  }
}

console.log(`Cleaned URL length: ${cleanedSupabaseUrl.length}`);
console.log(`Cleaned key length: ${cleanedSupabaseAnonKey.length}`);

// Validate environment variables
if (!cleanedSupabaseUrl || !cleanedSupabaseAnonKey) {
  console.error('Missing Supabase environment variables. Using fallbacks.');
  connectionStatus = 'missing-credentials';
  connectionError = new Error('Missing Supabase credentials');
}

// Create and export the Supabase client
let supabase: SupabaseClient;

try {
  console.log('Creating Supabase client with cleaned credentials...');
  
  // Create the client with the cleaned URL and key
  supabase = createClient(cleanedSupabaseUrl, cleanedSupabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
    },
  });
  
  console.log('Supabase client initialized successfully');
  connectionStatus = 'initialized';
  
  // Test the connection immediately
  (async () => {
    try {
      const { data, error } = await supabase
        .from('inventory_sales')
        .select('*', { count: 'exact', head: true });
        
      if (error) {
        console.error('Initial connection test failed:', error);
        connectionStatus = 'connection-test-failed';
        connectionError = new Error(`Connection test failed: ${error.message}`);
      } else {
        console.log('Initial connection test succeeded!');
        connectionStatus = 'connected';
      }
    } catch (e) {
      console.error('Exception during initial connection test:', e);
      connectionStatus = 'connection-test-exception';
      connectionError = e instanceof Error ? e : new Error('Unknown error during connection test');
    }
  })();
} catch (error) {
  console.error('Failed to initialize Supabase client:', error);
  connectionStatus = 'initialization-error';
  connectionError = error instanceof Error ? error : new Error('Unknown error during initialization');
  
  // Create a fallback client with a properly formatted JWT token
  supabase = createClient(
    'https://cpkxkoosykyahuezxela.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwa3hrb29zeWt5YWh1ZXp4ZWxhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAxMzQ0NzcsImV4cCI6MjA1NTcxMDQ3N30.R0MaAaqVFMLObwnMVz-eghsKb_HYDWhCOAeFrQcw8e0',
    { 
      auth: { 
        autoRefreshToken: false, 
        persistSession: false 
      } 
    }
  );
}

// Export the client and connection info
export { supabase };

// Table names for inventory management
export const TABLES = {
  PURCHASES: 'inventory_purchases',
  SALES: 'inventory_sales',
  CONSUMPTION: 'inventory_consumption',
  BALANCE_STOCK: 'inventory_balance_stock',
};

// Helper function to handle Supabase errors
export const handleSupabaseError = (error: any): Error => {
  // Check for JWT-specific errors
  if (error?.message && (
    error.message.includes('JWSError') || 
    error.message.includes('JWT') ||
    error.message.includes('CompactDecodeError')
  )) {
    console.error('JWT Authentication Error:', error.message);
    console.error('Current connection status:', connectionStatus);
    console.error('Connection error details:', connectionError);
    return new Error(`Authentication token error. Please check the console for details. Status: ${connectionStatus}`);
  }
  
  // Check for connection errors
  if (error?.code === 'PGRST16' || (error?.message && error.message.includes('Failed to fetch'))) {
    console.error('Connection Error:', error);
    return new Error('Unable to connect to the database. Please check your internet connection.');
  }
  
  console.error('Supabase error:', error);
  return new Error(error?.message || 'An error occurred with the database operation');
};

// Helper function to check if user is authenticated
export const checkAuthentication = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
  
  if (error) {
    console.error('Authentication error:', error);
      return null;
    }
    
    return data.session?.user || null;
  } catch (error) {
    console.error('Unexpected authentication error:', error);
    return null;
  }
};

// Helper function to check database connection
export const checkDatabaseConnection = async () => {
  try {
    const { data, error } = await supabase
      .from(TABLES.SALES)
      .select('*', { count: 'exact', head: true });
      
    if (error) {
      console.error('Database connection check failed:', error);
      return {
        connected: false,
        status: connectionStatus,
        error: error
      };
    }
    
    return {
      connected: true,
      status: 'connected',
      error: null
    };
  } catch (error) {
    console.error('Exception during database connection check:', error);
    return {
      connected: false,
      status: 'exception',
      error: error
    };
  }
}; 