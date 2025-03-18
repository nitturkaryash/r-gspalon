/**
 * Runs the SQL commands to set up inventory tables in Supabase
 * This can be run from a development environment or admin panel
 */
export declare const setupInventoryTables: () => Promise<void>;
export declare const checkInventoryTablesExist: () => Promise<boolean>;
