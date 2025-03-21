import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase/supabaseClient';
import { Purchase, Sale, Consumption, ProcessingStats } from '../models/inventoryTypes';

// Basic inventory hook to manage inventory-related state and operations
export const useInventory = () => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [consumption, setConsumption] = useState<Consumption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInventoryData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching inventory data...');

      // Fetch purchases with debug logging
      console.log('Fetching purchases...');
      const { data: purchasesData, error: purchasesError } = await supabase
        .from('inventory_purchases')
        .select('*');

      console.log('Purchases fetch response:', { data: purchasesData, error: purchasesError });

      if (purchasesError) {
        console.error('Error fetching purchases:', purchasesError);
        throw new Error(`Error fetching purchases: ${purchasesError.message}`);
      }
      
      // Fetch sales with debug logging
      console.log('Fetching sales...');
      const { data: salesData, error: salesError } = await supabase
        .from('inventory_sales')
        .select('*');

      console.log('Sales fetch response:', { data: salesData, error: salesError });

      if (salesError) {
        console.error('Error fetching sales:', salesError);
        throw new Error(`Error fetching sales: ${salesError.message}`);
      }
      
      // Fetch consumption with debug logging
      console.log('Fetching consumption...');
      const { data: consumptionData, error: consumptionError } = await supabase
        .from('inventory_consumption')
        .select('*');

      console.log('Consumption fetch response:', { data: consumptionData, error: consumptionError });

      if (consumptionError) {
        console.error('Error fetching consumption:', consumptionError);
        throw new Error(`Error fetching consumption: ${consumptionError.message}`);
      }

      // Update state with the fetched data
      console.log('Setting state with fetched data:', {
        purchases: purchasesData?.length || 0,
        sales: salesData?.length || 0,
        consumption: consumptionData?.length || 0,
      });

      setPurchases(purchasesData || []);
      setSales(salesData || []);
      setConsumption(consumptionData || []);
      
      // Notify that data has been refreshed
      console.log('Inventory data refreshed successfully');
      
      return {
        purchases: purchasesData || [],
        sales: salesData || [],
        consumption: consumptionData || []
      };
    } catch (err) {
      console.error('Error in fetchInventoryData:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Create a new purchase record
  const createPurchase = async (purchase: Omit<Purchase, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      // Prepare the purchase data with proper ID and timestamps
      const purchaseWithId = {
        ...purchase,
        purchase_id: `purchase-${Date.now()}`, // Generate a temporary id in the correct format
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      console.log('Creating purchase with data:', purchaseWithId);
      
      const { data, error } = await supabase
        .from('inventory_purchases')
        .insert([purchaseWithId])
        .select();

      if (error) {
        console.error('Supabase error creating purchase:', error);
        throw error;
      }
      
      console.log('Purchase created, database response:', data);
      
      // If we got data back from the insert, use it
      const newPurchase = data && data.length > 0 ? data[0] : purchaseWithId;
      
      // Update the local state immediately
      setPurchases(prev => [newPurchase, ...prev]);
      
      // Trigger a global refresh event
      window.dispatchEvent(new CustomEvent('refresh-inventory-data'));
      
      return newPurchase;
    } catch (error) {
      console.error('Error creating purchase:', error);
      throw error;
    }
  };

  // Create a new sale record
  const createSale = async (sale: Omit<Sale, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('inventory_sales')
        .insert([{
          ...sale,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select();

      if (error) throw error;
      
      if (data) {
        setSales(prev => [...prev, data[0]]);
        return data[0];
      }
      
      return null;
    } catch (error) {
      console.error('Error creating sale:', error);
      throw error;
    }
  };

  // Create a new consumption record
  const createConsumption = async (item: Omit<Consumption, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('inventory_consumption')
        .insert([{
          ...item,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select();

      if (error) throw error;
      
      if (data) {
        setConsumption(prev => [...prev, data[0]]);
        return data[0];
      }
      
      return null;
    } catch (error) {
      console.error('Error creating consumption record:', error);
      throw error;
    }
  };

  // Process batch imports with proper error handling
  const processBatchPurchases = async (purchaseRecords: Array<Partial<Purchase>>): Promise<ProcessingStats> => {
    let stats: ProcessingStats = {
      total: purchaseRecords.length,
      processed: 0,
      succeeded: 0,
      failed: 0,
      errors: []
    };

    for (const record of purchaseRecords) {
      try {
        stats.processed++;
        
        // Validate required fields
        if (!record.product_name || !record.date || !record.purchase_qty) {
          throw new Error(`Missing required fields for purchase record: ${JSON.stringify(record)}`);
        }
        
        await createPurchase(record as Omit<Purchase, 'id' | 'created_at' | 'updated_at'>);
        stats.succeeded++;
      } catch (error) {
        console.error('Error processing purchase record:', error);
        stats.failed++;
        stats = {
          ...stats,
          errors: [...(Array.isArray(stats.errors) ? stats.errors : [stats.errors]), 
                   `Error with record ${stats.processed}: ${error instanceof Error ? error.message : String(error)}`]
        };
      }
    }
    
    return stats;
  };

  // Process batch sales
  const processBatchSales = async (salesRecords: Array<Partial<Sale>>): Promise<ProcessingStats> => {
    let stats: ProcessingStats = {
      total: salesRecords.length,
      processed: 0,
      succeeded: 0,
      failed: 0,
      errors: []
    };

    for (const record of salesRecords) {
      try {
        stats.processed++;
        
        // Validate required fields
        if (!record.product_name || !record.date || !record.quantity) {
          throw new Error(`Missing required fields for sale record: ${JSON.stringify(record)}`);
        }
        
        await createSale(record as Omit<Sale, 'id' | 'created_at' | 'updated_at'>);
        stats.succeeded++;
      } catch (error) {
        console.error('Error processing sale record:', error);
        stats.failed++;
        stats = {
          ...stats,
          errors: [...(Array.isArray(stats.errors) ? stats.errors : [stats.errors]), 
                   `Error with record ${stats.processed}: ${error instanceof Error ? error.message : String(error)}`]
        };
      }
    }
    
    return stats;
  };

  // Process batch consumption
  const processBatchConsumption = async (consumptionRecords: Array<Partial<Consumption>>): Promise<ProcessingStats> => {
    let stats: ProcessingStats = {
      total: consumptionRecords.length,
      processed: 0,
      succeeded: 0,
      failed: 0,
      errors: []
    };

    for (const record of consumptionRecords) {
      try {
        stats.processed++;
        
        // Validate required fields
        if (!record.product_name || !record.date || !record.quantity) {
          throw new Error(`Missing required fields for consumption record: ${JSON.stringify(record)}`);
        }
        
        await createConsumption(record as Omit<Consumption, 'id' | 'created_at' | 'updated_at'>);
        stats.succeeded++;
      } catch (error) {
        console.error('Error processing consumption record:', error);
        stats.failed++;
        stats = {
          ...stats,
          errors: [...(Array.isArray(stats.errors) ? stats.errors : [stats.errors]), 
                   `Error with record ${stats.processed}: ${error instanceof Error ? error.message : String(error)}`]
        };
      }
    }
    
    return stats;
  };

  // Load data on mount
  useEffect(() => {
    fetchInventoryData();
    
    // Add event listener for global data refresh
    const handleRefreshInventory = () => {
      fetchInventoryData();
    };
    
    window.addEventListener('refresh-inventory-data', handleRefreshInventory);
    
    // Clean up event listener on unmount
    return () => {
      window.removeEventListener('refresh-inventory-data', handleRefreshInventory);
    };
  }, []);

  return {
    purchases,
    sales,
    consumption,
    loading,
    error,
    fetchInventoryData,
    createPurchase,
    createSale,
    createConsumption,
    processBatchPurchases,
    processBatchSales,
    processBatchConsumption
  };
}; 