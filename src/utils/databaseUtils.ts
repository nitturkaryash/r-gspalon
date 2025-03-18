import { db } from '../db/database';

/**
 * Export all database data as a JSON object for backup
 * @returns A JSON object containing all database data
 */
export const exportDatabaseData = async () => {
  try {
    const data = {
      appointments: await db.appointments.toArray(),
      stylists: await db.stylists.toArray(),
      services: await db.services.toArray(),
      serviceCollections: await db.serviceCollections.toArray(),
      collectionServices: await db.collectionServices.toArray(),
      version: 1, // Schema version
      exportDate: new Date().toISOString()
    };
    
    return data;
  } catch (error) {
    console.error('Failed to export database data:', error);
    throw error;
  }
};

/**
 * Save database data to a file
 */
export const saveBackupToFile = async () => {
  try {
    const data = await exportDatabaseData();
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
 * Import data from a backup file into the database
 * @param backupData The backup data to import
 */
export const importDatabaseData = async (backupData: any) => {
  if (!backupData || typeof backupData !== 'object') {
    throw new Error('Invalid backup data format');
  }
  
  // Validate required tables are in the backup
  const requiredTables = ['appointments', 'stylists', 'services', 'serviceCollections', 'collectionServices'];
  for (const table of requiredTables) {
    if (!backupData[table] || !Array.isArray(backupData[table])) {
      throw new Error(`Backup is missing required table: ${table}`);
    }
  }
  
  try {
    // Start a transaction to perform the entire import atomically
    await db.transaction('rw', 
      db.appointments, 
      db.stylists, 
      db.services, 
      db.serviceCollections, 
      db.collectionServices, 
      async () => {
      // Clear all tables before import
      await db.appointments.clear();
      await db.stylists.clear();
      await db.services.clear();
      await db.serviceCollections.clear();
      await db.collectionServices.clear();
      
      // Import data
      if (backupData.stylists?.length) {
        await db.stylists.bulkAdd(backupData.stylists);
      }
      
      if (backupData.services?.length) {
        await db.services.bulkAdd(backupData.services);
      }
      
      if (backupData.serviceCollections?.length) {
        await db.serviceCollections.bulkAdd(backupData.serviceCollections);
      }
      
      if (backupData.collectionServices?.length) {
        await db.collectionServices.bulkAdd(backupData.collectionServices);
      }
      
      if (backupData.appointments?.length) {
        await db.appointments.bulkAdd(backupData.appointments);
      }
    });
    
    return true;
  } catch (error) {
    console.error('Failed to import database data:', error);
    throw error;
  }
};

/**
 * Clear all data from the database (useful for testing or resetting)
 */
export const clearAllData = async () => {
  try {
    await db.transaction('rw', 
      db.appointments, 
      db.stylists, 
      db.services, 
      db.serviceCollections, 
      db.collectionServices, 
      async () => {
      await db.appointments.clear();
      await db.stylists.clear();
      await db.services.clear();
      await db.serviceCollections.clear();
      await db.collectionServices.clear();
    });
    
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