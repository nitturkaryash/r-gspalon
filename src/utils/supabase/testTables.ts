import { supabase } from './supabaseClient';
import { TABLES } from './supabaseClient';

// Define interface for table stats
interface TableStats {
  table: string;
  exists: boolean;
  count: number;
  error?: string;
}

/**
 * Get stats for all inventory tables
 * @returns Promise<TableStats[]> Array of table stats
 */
export async function getTableStats(): Promise<TableStats[]> {
  try {
    const tableNames = Object.values(TABLES);
    const stats: TableStats[] = [];
    
    for (const tableName of tableNames) {
      try {
        // First check if the table exists by trying to count records
        const { data, error, count } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });
          
        if (error) {
          console.error(`Error querying table ${tableName}:`, error);
          stats.push({
            table: tableName,
            exists: false,
            count: 0,
            error: error.message
          });
          continue;
        }
        
        // Table exists, get record count
        stats.push({
          table: tableName,
          exists: true,
          count: count || 0
        });
        
        console.log(`Table ${tableName} has ${count || 0} records`);
      } catch (err) {
        console.error(`Error checking table ${tableName}:`, err);
        stats.push({
          table: tableName,
          exists: false,
          count: 0,
          error: err instanceof Error ? err.message : String(err)
        });
      }
    }
    
    return stats;
  } catch (error) {
    console.error('Error getting table stats:', error);
    return [];
  }
}

// Function to insert a test purchase record
export const insertTestPurchase = async (): Promise<boolean> => {
  try {
    const testPurchase = {
      product_name: 'Test Shampoo',
      hsn_code: '33051010',
      units: 'bottles',
      purchase_invoice_number: 'TEST-001',
      purchase_qty: 10,
      mrp_incl_gst: 500,
      discount_on_purchase_percentage: 5,
      gst_percentage: 18
    };
    
    const { data, error } = await supabase
      .from('inventory_purchases')
      .insert([testPurchase])
      .select();
    
    if (error) {
      console.error('Error inserting test purchase:', error);
      return false;
    }
    
    console.log('Test purchase inserted successfully:', data);
    return true;
  } catch (error) {
    console.error('Failed to insert test purchase:', error);
    return false;
  }
};

// Function to check if the tables have data
export const checkTableData = async (): Promise<{
  purchasesCount: number;
  salesCount: number;
  consumptionCount: number;
}> => {
  // Check purchases count
  const { data: purchasesData, error: purchasesError } = await supabase
    .from('inventory_purchases')
    .select('count', { count: 'exact', head: true });
  
  const purchasesCount = purchasesError ? 0 : (purchasesData?.[0]?.count ?? 0);
  
  // Check sales count
  const { data: salesData, error: salesError } = await supabase
    .from('inventory_sales')
    .select('count', { count: 'exact', head: true });
  
  const salesCount = salesError ? 0 : (salesData?.[0]?.count ?? 0);
  
  // Check consumption count
  const { data: consumptionData, error: consumptionError } = await supabase
    .from('inventory_consumption')
    .select('count', { count: 'exact', head: true });
  
  const consumptionCount = consumptionError ? 0 : (consumptionData?.[0]?.count ?? 0);
  
  console.log('Table data counts:', {
    purchasesCount,
    salesCount,
    consumptionCount
  });
  
  return {
    purchasesCount,
    salesCount,
    consumptionCount
  };
}; 