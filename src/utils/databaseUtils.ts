// import { db } from '../db/database';
import { supabase } from './supabase/supabaseClient';

/**
 * Function to get database information
 */
export async function getDatabaseInfo() {
  try {
    const { data, error } = await supabase.from('system_info').select('*').limit(1);
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error getting database info:', error);
    return null;
  }
}

/**
 * Export database data to a backup object
 */
export async function exportDatabaseToJson() {
  try {
    // Get all data from Supabase tables
    const [purchasesResult, salesResult, consumptionResult] = await Promise.all([
      supabase.from('inventory_purchases').select('*'),
      supabase.from('inventory_sales').select('*'),
      supabase.from('inventory_consumption').select('*')
    ]);

    // Check for errors
    if (purchasesResult.error) throw purchasesResult.error;
    if (salesResult.error) throw salesResult.error;
    if (consumptionResult.error) throw consumptionResult.error;

    return {
      purchases: purchasesResult.data || [],
      sales: salesResult.data || [],
      consumption: consumptionResult.data || [],
      exportDate: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error exporting database to JSON:', error);
    throw error;
  }
}

/**
 * Import data from a backup file
 * @param backupData The backup data to import
 */
export async function importDatabaseFromJson(backupData: any) {
  try {
    if (!backupData) {
      throw new Error('No backup data provided');
    }

    // Clear existing data 
    const clearResults = await Promise.all([
      supabase.from('inventory_purchases').delete().gt('id', '0'),
      supabase.from('inventory_sales').delete().gt('id', '0'),
      supabase.from('inventory_consumption').delete().gt('id', '0')
    ]);
    
    // Check for errors
    clearResults.forEach(result => {
      if (result.error) throw result.error;
    });

    // Import data
    const importResults = await Promise.all([
      backupData.purchases?.length > 0 ? 
        supabase.from('inventory_purchases').insert(backupData.purchases) : 
        Promise.resolve({ data: null, error: null }),
      
      backupData.sales?.length > 0 ? 
        supabase.from('inventory_sales').insert(backupData.sales) : 
        Promise.resolve({ data: null, error: null }),
      
      backupData.consumption?.length > 0 ? 
        supabase.from('inventory_consumption').insert(backupData.consumption) : 
        Promise.resolve({ data: null, error: null })
    ]);

    // Check for errors
    importResults.forEach(result => {
      if (result.error) throw result.error;
    });

    return { success: true };
  } catch (error) {
    console.error('Error importing database from JSON:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Save database data to a file
 */
export const saveBackupToFile = async () => {
  try {
    const data = await exportDatabaseToJson();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Create a link and programmatically click it to trigger the download
    const a = document.createElement('a');
    a.href = url;
    a.download = `salon-data-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Failed to save backup:', error);
    throw error;
  }
};

/**
 * Clear all data from the database (useful for testing or resetting)
 */
export const clearAllData = async () => {
  try {
    await supabase.from('inventory_purchases').delete().gt('id', '0');
    await supabase.from('inventory_sales').delete().gt('id', '0');
    await supabase.from('inventory_consumption').delete().gt('id', '0');
    
    return true;
  } catch (error) {
    console.error('Failed to clear database:', error);
    throw error;
  }
};

/**
 * Load a backup file from the user's device
 * @returns The parsed backup data
 */
export const loadBackupFile = () => {
  return new Promise<any>((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) {
        reject(new Error('No file selected'));
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          resolve(data);
        } catch (error) {
          reject(new Error('Invalid JSON file'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsText(file);
    };
    
    input.click();
  });
}; 