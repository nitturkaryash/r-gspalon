import { supabase, TABLES } from './supabaseClient';

/**
 * Utility to check if required tables exist in Supabase
 * This will help diagnose connection and table issues
 */
export const checkSupabaseTables = async (): Promise<{
  success: boolean;
  tables: Record<string, boolean>;
  error?: string;
}> => {
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
    
    const tableStatus: Record<string, boolean> = {};
    
    // Check each table
    for (const table of tablesToCheck) {
      try {
        console.log(`Checking table: ${table}`);
        const { error } = await supabase
          .from(table)
          .select('*', { head: true });
        
        if (error) {
          console.error(`Error checking table ${table}:`, error);
          tableStatus[table] = false;
        } else {
          console.log(`Table ${table} exists`);
          tableStatus[table] = true;
        }
      } catch (e) {
        console.error(`Exception checking table ${table}:`, e);
        tableStatus[table] = false;
      }
    }
    
    return {
      success: Object.values(tableStatus).some(exists => exists),
      tables: tableStatus
    };
  } catch (e) {
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
export const getSampleData = async (): Promise<{
  collections?: any[];
  products?: any[];
  error?: string;
}> => {
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
  } catch (e) {
    console.error('Error getting sample data:', e);
    return {
      error: e instanceof Error ? e.message : 'Unknown error'
    };
  }
};

/**
 * Check if the inventory tables exist in the database
 */
export async function checkInventoryTablesExist(): Promise<boolean> {
  try {
    // Convert TABLES object values to array
    const tables = Object.values(TABLES);
    
    // Check each table
    for (const table of tables) {
      try {
        // Use head: true to only check if the table exists without fetching data
        const { error } = await supabase
          .from(table)
          .select('*', { head: true });
        
        if (error) {
          console.error(`Error checking table ${table}:`, error);
          return false;
        }
        
        console.log(`Table ${table} exists`);
      } catch (err) {
        console.error(`Error checking table ${table}:`, err);
        return false;
      }
    }
    
    // All tables exist if we got here
    return true;
  } catch (error) {
    console.error('Error checking inventory tables:', error);
    return false;
  }
} 