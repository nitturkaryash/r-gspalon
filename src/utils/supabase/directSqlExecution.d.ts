/**
 * Executes SQL statements directly on Supabase
 * This is a more direct approach than using RPC
 */
export declare const executeSql: (sql: string) => Promise<any>;
/**
 * Creates the UUID extension if it doesn't exist
 * This is required for the uuid_generate_v4() function
 */
export declare const ensureUuidExtension: () => Promise<void>;
/**
 * Creates a table with a simple structure to test SQL execution
 */
export declare const createTestTable: () => Promise<boolean>;
