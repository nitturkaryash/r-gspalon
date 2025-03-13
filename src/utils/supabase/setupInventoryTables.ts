import { supabase } from './supabaseClient';
import inventorySchema from './inventory_schema.sql?raw';

/**
 * Runs the SQL commands to set up inventory tables in Supabase
 * This can be run from a development environment or admin panel
 */
export const setupInventoryTables = async (): Promise<void> => {
  try {
    console.log('Setting up inventory tables...');
    
    // Split the SQL file into individual statements and execute them
    const statements = inventorySchema
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);
    
    for (const statement of statements) {
      const { error } = await supabase.rpc('exec_sql', { sql: statement });
      if (error) {
        console.error(`Error executing SQL statement: ${error.message}`);
        console.error('Statement:', statement);
        throw error;
      }
    }
    
    console.log('Inventory tables setup complete!');
  } catch (error) {
    console.error('Failed to set up inventory tables:', error);
    throw error;
  }
};

// Optional: Export a function to test if tables exist
export const checkInventoryTablesExist = async (): Promise<boolean> => {
  try {
    // Try to query the purchases table
    const { data, error } = await supabase
      .from('inventory_purchases')
      .select('count(*)', { count: 'exact', head: true });
    
    if (error) {
      console.error('Error checking inventory tables:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Failed to check if inventory tables exist:', error);
    return false;
  }
}; 