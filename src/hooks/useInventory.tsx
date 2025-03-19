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

      // Fetch purchases
      const { data: purchasesData, error: purchasesError } = await supabase
        .from('inventory_purchases')
        .select('*');

      if (purchasesError) throw new Error(`Error fetching purchases: ${purchasesError.message}`);
      
      // Fetch sales
      const { data: salesData, error: salesError } = await supabase
        .from('inventory_sales')
        .select('*');

      if (salesError) throw new Error(`Error fetching sales: ${salesError.message}`);
      
      // Fetch consumption
      const { data: consumptionData, error: consumptionError } = await supabase
        .from('inventory_consumption')
        .select('*');

      if (consumptionError) throw new Error(`Error fetching consumption: ${consumptionError.message}`);

      // Update state
      setPurchases(purchasesData || []);
      setSales(salesData || []);
      setConsumption(consumptionData || []);
    } catch (err) {
      console.error('Error in fetchInventoryData:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Create a new purchase record
  const createPurchase = async (purchase: Omit<Purchase, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('inventory_purchases')
        .insert([{
          ...purchase,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select();

      if (error) throw error;
      
      if (data) {
        setPurchases(prev => [...prev, data[0]]);
        return data[0];
      }
      
      return null;
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