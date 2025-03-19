import { supabase } from './supabaseClient';

// Define an interface for the SQL execution result
interface SqlResult {
  success: boolean;
  data?: any;
  error?: any;
}

/**
 * Execute SQL directly using REST API call
 * This allows us to run arbitrary SQL commands that might not be supported by the Supabase client
 */
export async function executeSql(sql: string): Promise<SqlResult> {
  try {
    console.log('Executing SQL:', sql);
    
    // Get environment variables instead of accessing protected properties
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase URL or Key');
      return { 
        success: false, 
        error: 'Missing Supabase URL or Key' 
      };
    }
    
    // Use REST API to execute SQL
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/execute_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ sql_query: sql })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('SQL execution failed:', errorText);
      return { 
        success: false, 
        error: errorText 
      };
    }
    
    const data = await response.json();
    return { 
      success: true, 
      data 
    };
  } catch (error) {
    console.error('Error executing SQL:', error);
    return { 
      success: false, 
      error 
    };
  }
}

/**
 * Ensure the UUID extension is created
 */
export async function ensureUuidExtension(): Promise<SqlResult> {
  try {
    const result = await executeSql(
      `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`
    );
    
    if (!result.success) {
      console.error('Failed to create UUID extension:', result.error);
      return result;
    }
    
    console.log('UUID extension ensured');
    return result;
  } catch (error) {
    console.error('Error ensuring UUID extension:', error);
    return { 
      success: false, 
      error 
    };
  }
}

/**
 * Create a function to execute SQL commands
 */
export async function createExecSqlFunction(): Promise<SqlResult> {
  try {
    const result = await executeSql(`
      CREATE OR REPLACE FUNCTION execute_sql(sql_query TEXT)
      RETURNS JSONB
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      DECLARE
        result JSONB;
      BEGIN
        EXECUTE sql_query;
        result := '{"success": true}'::JSONB;
        RETURN result;
      EXCEPTION WHEN OTHERS THEN
        result := jsonb_build_object(
          'success', false,
          'error', SQLERRM,
          'code', SQLSTATE
        );
        RETURN result;
      END;
      $$;
    `);
    
    if (!result.success) {
      console.error('Failed to create execute_sql function:', result.error);
      return result;
    }
    
    console.log('SQL execution function created');
    return result;
  } catch (error) {
    console.error('Error creating execute_sql function:', error);
    return { 
      success: false, 
      error 
    };
  }
}

/**
 * Creates a table with a simple structure to test SQL execution
 */
export const createTestTable = async (): Promise<boolean> => {
  try {
    const result = await executeSql(`
      CREATE TABLE IF NOT EXISTS test_table (
        id SERIAL PRIMARY KEY,
        name TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    return result.success;
  } catch (error) {
    console.error('Failed to create test table:', error);
    return false;
  }
}; 