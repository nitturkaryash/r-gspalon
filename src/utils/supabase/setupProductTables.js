import { supabase } from './supabaseClient';
import { executeSql, ensureUuidExtension } from './directSqlExecution';
import sqlScript from './product_tables.sql?raw';
/**
 * Runs the SQL commands to set up product tables in Supabase
 * This can be run from a development environment or admin panel
 */
export const setupProductTables = async () => {
    try {
        console.log('Setting up product tables...');
        // First ensure the UUID extension is available
        try {
            await ensureUuidExtension();
        }
        catch (uuidError) {
            console.error('Failed to ensure UUID extension:', uuidError);
            throw new Error(`Failed to set up UUID extension: ${uuidError instanceof Error ? uuidError.message : 'Unknown error'}`);
        }
        // Split the SQL file into individual statements and execute them
        const statements = sqlScript
            .split(';')
            .map(statement => statement.trim())
            .filter(statement => statement.length > 0);
        console.log(`Found ${statements.length} SQL statements to execute`);
        const errors = [];
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            console.log(`Executing statement ${i + 1}/${statements.length}: ${statement.substring(0, 50)}...`);
            try {
                const result = await executeSql(statement);
                if (!result.success) {
                    const errorMsg = `Error executing SQL statement ${i + 1}: ${result.error?.message || 'Unknown error'}`;
                    console.error(errorMsg);
                    console.error('Statement:', statement);
                    // For critical statements (table creation), we should throw an error
                    if (statement.toLowerCase().includes('create table')) {
                        throw new Error(errorMsg);
                    }
                    // For non-critical statements (indexes, policies), we'll collect errors but continue
                    errors.push({
                        statement: i + 1,
                        sql: statement,
                        error: result.error
                    });
                }
                else {
                    console.log(`Successfully executed statement ${i + 1}`);
                }
            }
            catch (statementError) {
                const errorMsg = `Error executing statement ${i + 1}: ${statementError instanceof Error ? statementError.message : 'Unknown error'}`;
                console.error(errorMsg);
                // For critical statements (table creation), we should throw an error
                if (statement.toLowerCase().includes('create table')) {
                    throw new Error(errorMsg);
                }
                // For non-critical statements (indexes, policies), we'll collect errors but continue
                errors.push({
                    statement: i + 1,
                    sql: statement,
                    error: statementError
                });
            }
        }
        // If we have non-critical errors, log them but don't fail the entire process
        if (errors.length > 0) {
            console.warn(`Completed with ${errors.length} non-critical errors:`, errors);
        }
        else {
            console.log('Product tables setup complete without errors!');
        }
        // Verify tables were created
        try {
            const tablesExist = await checkProductTablesExist();
            console.log('Tables verification result:', tablesExist);
            if (!tablesExist) {
                throw new Error('Tables were not created successfully. Please check the Supabase logs for more details.');
            }
        }
        catch (verificationError) {
            console.error('Failed to verify tables:', verificationError);
            throw new Error(`Tables may have been created but verification failed: ${verificationError instanceof Error ? verificationError.message : 'Unknown error'}`);
        }
    }
    catch (error) {
        console.error('Failed to set up product tables:', error);
        throw error;
    }
};
// Function to test if tables exist
export const checkProductTablesExist = async () => {
    try {
        console.log('Checking if product tables exist...');
        // Try to query the product_collections table
        const { data: collectionsData, error: collectionsError } = await supabase
            .from('product_collections')
            .select('count(*)', { count: 'exact', head: true });
        console.log('Product collections table check:', { data: collectionsData, error: collectionsError });
        if (collectionsError) {
            console.error('Error checking product_collections table:', collectionsError);
            return false;
        }
        // Also check the products table
        const { error: productsError } = await supabase
            .from('products')
            .select('count(*)', { count: 'exact', head: true });
        console.log('Products table check:', { error: productsError });
        if (productsError) {
            console.error('Error checking products table:', productsError);
            return false;
        }
        console.log('All product tables exist!');
        return true;
    }
    catch (error) {
        console.error('Failed to check if product tables exist:', error);
        return false;
    }
};
