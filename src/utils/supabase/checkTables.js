import { supabase } from './supabaseClient';
/**
 * Utility to check if required tables exist in Supabase
 * This will help diagnose connection and table issues
 */
export const checkSupabaseTables = async () => {
    try {
        console.log('Checking Supabase tables...');
        // List of tables to check
        const tablesToCheck = [
            'product_collections',
            'products',
            'inventory_purchases',
            'inventory_sales',
            'inventory_consumption',
            'inventory_balance_stock'
        ];
        const tableStatus = {};
        // Check each table
        for (const table of tablesToCheck) {
            try {
                console.log(`Checking table: ${table}`);
                const { data, error } = await supabase
                    .from(table)
                    .select('count(*)', { count: 'exact', head: true });
                if (error) {
                    console.error(`Error checking table ${table}:`, error);
                    tableStatus[table] = false;
                }
                else {
                    console.log(`Table ${table} exists with count:`, data?.count);
                    tableStatus[table] = true;
                }
            }
            catch (e) {
                console.error(`Exception checking table ${table}:`, e);
                tableStatus[table] = false;
            }
        }
        return {
            success: Object.values(tableStatus).some(exists => exists),
            tables: tableStatus
        };
    }
    catch (e) {
        console.error('Error checking Supabase tables:', e);
        return {
            success: false,
            tables: {},
            error: e instanceof Error ? e.message : 'Unknown error'
        };
    }
};
/**
 * Utility to get sample data from tables
 */
export const getSampleData = async () => {
    try {
        // Get sample data from product_collections
        const { data: collections, error: collectionsError } = await supabase
            .from('product_collections')
            .select('*')
            .limit(5);
        if (collectionsError) {
            console.error('Error fetching collections:', collectionsError);
        }
        // Get sample data from products
        const { data: products, error: productsError } = await supabase
            .from('products')
            .select('*')
            .limit(5);
        if (productsError) {
            console.error('Error fetching products:', productsError);
        }
        return {
            collections: collections || [],
            products: products || [],
            error: collectionsError?.message || productsError?.message
        };
    }
    catch (e) {
        console.error('Error getting sample data:', e);
        return {
            error: e instanceof Error ? e.message : 'Unknown error'
        };
    }
};
