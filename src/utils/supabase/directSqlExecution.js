import { supabase } from './supabaseClient';
/**
 * Executes SQL statements directly on Supabase
 * This is a more direct approach than using RPC
 */
export const executeSql = async (sql) => {
    try {
        // First try using the SQL API if available
        console.log('Attempting to execute SQL via RPC method...');
        const { data, error } = await supabase.rpc('exec_sql', { sql });
        if (!error) {
            console.log('SQL execution via RPC successful');
            return { success: true, data };
        }
        // If that fails, try using the REST API
        console.log('RPC method failed with error:', error);
        console.log('Trying REST API...');
        try {
            const response = await fetch(`${supabase.supabaseUrl}/rest/v1/sql`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': supabase.supabaseKey,
                    'Authorization': `Bearer ${supabase.supabaseKey}`,
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify({ query: sql })
            });
            console.log('REST API response status:', response.status);
            if (!response.ok) {
                const errorText = await response.text();
                console.error('REST API error response:', errorText);
                throw new Error(`SQL execution failed: ${response.statusText} - ${errorText}`);
            }
            const responseData = await response.json();
            console.log('REST API execution successful');
            return { success: true, data: responseData };
        }
        catch (restError) {
            console.error('REST API execution error:', restError);
            // Try one more approach - direct SQL execution
            console.log('Trying direct SQL execution...');
            try {
                const { data: directData, error: directError } = await supabase.from('_exec_sql').select().sql(sql);
                if (directError) {
                    console.error('Direct SQL execution error:', directError);
                    return {
                        success: false,
                        error: {
                            ...directError,
                            message: `SQL execution failed: ${directError.message || 'Unknown error'}`,
                            details: `SQL: ${sql.substring(0, 100)}...`
                        }
                    };
                }
                console.log('Direct SQL execution successful');
                return { success: true, data: directData };
            }
            catch (directExecError) {
                console.error('Direct SQL execution exception:', directExecError);
                return {
                    success: false,
                    error: {
                        message: directExecError instanceof Error
                            ? `SQL execution failed: ${directExecError.message}`
                            : 'SQL execution failed with unknown error',
                        details: `SQL: ${sql.substring(0, 100)}...`,
                        originalError: directExecError
                    }
                };
            }
        }
    }
    catch (error) {
        console.error('SQL execution error:', error);
        return {
            success: false,
            error: {
                message: error instanceof Error
                    ? `SQL execution failed: ${error.message}`
                    : 'SQL execution failed with unknown error',
                details: `SQL: ${sql.substring(0, 100)}...`,
                originalError: error
            }
        };
    }
};
/**
 * Creates the UUID extension if it doesn't exist
 * This is required for the uuid_generate_v4() function
 */
export const ensureUuidExtension = async () => {
    try {
        const result = await executeSql('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
        if (!result.success) {
            console.error('Failed to create UUID extension:', result.error);
            throw new Error(`Failed to create UUID extension: ${result.error?.message || 'Unknown error'}`);
        }
        console.log('UUID extension is available');
    }
    catch (error) {
        console.error('Failed to create UUID extension:', error);
        throw new Error(`Failed to create UUID extension: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};
/**
 * Creates a table with a simple structure to test SQL execution
 */
export const createTestTable = async () => {
    try {
        const result = await executeSql(`
      CREATE TABLE IF NOT EXISTS test_table (
        id SERIAL PRIMARY KEY,
        name TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
        return result.success;
    }
    catch (error) {
        console.error('Failed to create test table:', error);
        return false;
    }
};
