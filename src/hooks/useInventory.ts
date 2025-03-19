import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, TABLES, handleSupabaseError } from '../utils/supabase/supabaseClient';
import { 
  Purchase, 
  Sale, 
  Consumption, 
  BalanceStock, 
  PurchaseFormState,
  ProcessingStats,
  InventoryExportData
} from '../models/inventoryTypes';
import { v4 } from 'uuid';

// Query keys for caching
const QUERY_KEYS = {
  PURCHASES: 'inventory-purchases',
  SALES: 'inventory-sales',
  CONSUMPTION: 'inventory-consumption',
  BALANCE_STOCK: 'inventory-balance-stock',
};

// Add interface for salon consumption recording
export interface SalonConsumptionItem {
  product_name: string;
  quantity: number;
  purpose: string;
  // Financial values from POS
  unit_price?: number;
  hsn_code?: string;
  units?: string;
  date?: string;
  requisition_voucher_no?: string;
}

export const useInventory = () => {
  const queryClient = useQueryClient();
  const [isCreatingPurchase, setIsCreatingPurchase] = useState(false);
  const [isSyncingSales, setIsSyncingSales] = useState(false);
  const [isSyncingConsumption, setIsSyncingConsumption] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [processingStats, setProcessingStats] = useState<ProcessingStats | null>(null);

  // Function to calculate derived values for purchases
  const calculatePurchaseValues = (data: PurchaseFormState): Partial<Purchase> => {
    const mrpInclGst = data.mrp_incl_gst;
    const gstPercentage = data.gst_percentage;
    const discountPercentage = data.discount_on_purchase_percentage;
    const quantity = data.purchase_qty;
    
    // Calculate MRP excluding GST
    const mrpExclGst = mrpInclGst / (1 + (gstPercentage / 100));
    
    // Apply discount
    const discountedRate = mrpExclGst * (1 - (discountPercentage / 100));
    
    // Calculate taxable value (rate * quantity)
    const taxableValue = discountedRate * quantity;
    
    // Calculate GST amounts
    const totalGst = taxableValue * (gstPercentage / 100);
    const cgst = totalGst / 2;
    const sgst = totalGst / 2;
    const igst = 0; // Assuming IGST is 0 for local purchases
    
    // Calculate invoice value
    const invoiceValue = taxableValue + totalGst;
    
    return {
      ...data,
      mrp_excl_gst: parseFloat(mrpExclGst.toFixed(2)),
      purchase_taxable_value: parseFloat(taxableValue.toFixed(2)),
      purchase_igst: parseFloat(igst.toFixed(2)),
      purchase_cgst: parseFloat(cgst.toFixed(2)),
      purchase_sgst: parseFloat(sgst.toFixed(2)),
      purchase_invoice_value_rs: parseFloat(invoiceValue.toFixed(2)),
    };
  };

  // Query to fetch purchases
  const purchasesQuery = useQuery({
    queryKey: [QUERY_KEYS.PURCHASES],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from(TABLES.PURCHASES)
          .select('*')
          .order('date', { ascending: false });
        
        if (error) throw handleSupabaseError(error);
        
        return data as Purchase[];
      } catch (error) {
        console.error('Error fetching purchases:', error);
        throw error;
      }
    },
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Query to fetch sales
  const salesQuery = useQuery({
    queryKey: [QUERY_KEYS.SALES],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from(TABLES.SALES)
          .select('*')
          .order('date', { ascending: false });
        
        if (error) throw handleSupabaseError(error);
        
        return data as Sale[];
      } catch (error) {
        console.error('Error fetching sales:', error);
        throw error;
      }
    },
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Query to fetch consumption
  const consumptionQuery = useQuery({
    queryKey: [QUERY_KEYS.CONSUMPTION],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from(TABLES.CONSUMPTION)
          .select('*')
          .order('date', { ascending: false });
        
        if (error) throw handleSupabaseError(error);
        
        return data as Consumption[];
      } catch (error) {
        console.error('Error fetching consumption:', error);
        throw error;
      }
    },
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Query to fetch balance stock
  const balanceStockQuery = useQuery({
    queryKey: [QUERY_KEYS.BALANCE_STOCK],
    queryFn: async () => {
      try {
        // Log the actual table name being used for debugging
        console.log('Querying balance stock table:', TABLES.BALANCE_STOCK);
        
        // Ensure we're using a valid table name, not undefined
        const tableName = TABLES.BALANCE_STOCK || 'inventory_balance_stock';
        
        const { data, error } = await supabase
          .from(tableName)
          .select('*');
        
        if (error) {
          console.error(`Error querying ${tableName}:`, error);
          throw handleSupabaseError(error);
        }
        
        // Log success for debugging
        console.log(`Successfully fetched ${data?.length || 0} balance stock records`);
        return data as BalanceStock[];
      } catch (error) {
        console.error('Error fetching balance stock:', error);
        throw error;
      }
    },
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Mutation to create a new purchase
  const createPurchaseMutation = useMutation({
    mutationFn: async (purchaseData: PurchaseFormState) => {
      setIsCreatingPurchase(true);
      try {
        // Calculate derived values
        const fullPurchaseData = calculatePurchaseValues(purchaseData);
        
        // Insert into Supabase
        const { data, error } = await supabase
          .from(TABLES.PURCHASES)
          .insert([fullPurchaseData])
          .select();
        
        if (error) throw handleSupabaseError(error);
        
        return data as Purchase[];
      } catch (error) {
        console.error('Error creating purchase:', error);
        throw error;
      } finally {
        setIsCreatingPurchase(false);
      }
    },
    onSuccess: () => {
      // Invalidate cache and refetch data
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PURCHASES] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.BALANCE_STOCK] });
    }
  });

  // Function to create a new purchase
  const createPurchase = async (purchaseData: PurchaseFormState) => {
    return createPurchaseMutation.mutateAsync(purchaseData);
  };

  // Mock function to simulate fetching sales from POS
  // In a real application, this would connect to your POS API
  const fetchSalesFromPOS = async (startDate: string, endDate: string): Promise<any[]> => {
    // This is a placeholder - you'll replace with actual POS integration
    // For now, generate some mock data
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
    
    const mockOrders = [];
    const startDateTime = new Date(startDate);
    const endDateTime = new Date(endDate);
    const dayDiff = Math.floor((endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60 * 60 * 24));
    
    // Generate some mock orders
    for (let i = 0; i < Math.min(dayDiff + 1, 10); i++) {
      const orderDate = new Date(startDateTime);
      orderDate.setDate(startDateTime.getDate() + i);
      
      const orderItems = [];
      const itemCount = Math.floor(Math.random() * 3) + 1; // 1-3 items per order
      
      for (let j = 0; j < itemCount; j++) {
        // Get a random product from purchases if available, or use placeholder
        const products = purchasesQuery.data || [];
        const product = products.length > 0 
          ? products[Math.floor(Math.random() * products.length)]
          : {
              product_name: `Product ${j + 1}`,
              hsn_code: `HSN${Math.floor(1000 + Math.random() * 9000)}`,
              units: 'pcs',
              mrp_incl_gst: Math.floor(100 + Math.random() * 900),
              mrp_excl_gst: Math.floor(80 + Math.random() * 800),
              gst_percentage: [5, 12, 18, 28][Math.floor(Math.random() * 4)]
            };
        
        orderItems.push({
          product_name: product.product_name,
          hsn_code: product.hsn_code,
          units: product.units,
          quantity: Math.floor(Math.random() * 3) + 1,
          mrp_incl_gst: product.mrp_incl_gst,
          mrp_excl_gst: product.mrp_excl_gst,
          discount_percentage: Math.floor(Math.random() * 10),
          gst_percentage: product.gst_percentage
        });
      }
      
      mockOrders.push({
        order_id: `ORD-${Math.floor(10000 + Math.random() * 90000)}`,
        invoice_no: `INV-${Math.floor(10000 + Math.random() * 90000)}`,
        date: orderDate.toISOString(),
        items: orderItems
      });
    }
    
    return mockOrders;
  };

  // Function to sync sales data from POS
  const syncSalesFromPos = async (startDate: string, endDate: string) => {
    setIsSyncingSales(true);
    setProcessingStats({
      startTime: new Date(),
      endTime: null,
      total: 0,
      processed: 0,
      succeeded: 0,
      failed: 0,
      errors: []
    });
    
    try {
      // Fetch orders from POS
      const orders = await fetchSalesFromPOS(startDate, endDate);
      
      setProcessingStats(prev => ({
        ...prev!,
        total: orders.reduce((acc, order) => acc + order.items.length, 0)
      }));
      
      // Process each order
      for (const order of orders) {
        // Process each item in the order
        for (const item of order.items) {
          try {
            // Calculate sales values
            const mrpInclGst = item.mrp_incl_gst;
            const mrpExclGst = item.mrp_excl_gst;
            const discountPercentage = item.discount_percentage;
            const gstPercentage = item.gst_percentage;
            const quantity = item.quantity;
            
            // Calculate discounted rate
            const discountedRateExclGst = mrpExclGst * (1 - (discountPercentage / 100));
            
            // Calculate taxable value
            const taxableValue = discountedRateExclGst * quantity;
            
            // Calculate GST amounts
            const totalGst = taxableValue * (gstPercentage / 100);
            const cgst = totalGst / 2;
            const sgst = totalGst / 2;
            const igst = 0; // Assuming IGST is 0 for local sales
            
            // Calculate invoice value
            const invoiceValue = taxableValue + totalGst;
            
            // Get purchase cost details (for FIFO costing)
            // In a real application, you would implement FIFO logic here
            // For now, use simplified approach by getting the latest purchase
            const { data: purchaseData } = await supabase
              .from(TABLES.PURCHASES)
              .select('*')
              .eq('product_name', item.product_name)
              .order('date', { ascending: false })
              .limit(1);
            
            const purchaseCost = purchaseData && purchaseData.length > 0
              ? {
                  purchase_cost_per_unit_ex_gst: purchaseData[0].mrp_excl_gst * (1 - (purchaseData[0].discount_on_purchase_percentage / 100)),
                  purchase_gst_percentage: purchaseData[0].gst_percentage,
                  total_purchase_cost: (purchaseData[0].mrp_excl_gst * (1 - (purchaseData[0].discount_on_purchase_percentage / 100)) * item.quantity) * (1 + (purchaseData[0].gst_percentage / 100))
                }
              : {
                  purchase_cost_per_unit_ex_gst: mrpExclGst * 0.5, // Fallback: assume 50% of MRP is cost
                  purchase_gst_percentage: gstPercentage,
                  total_purchase_cost: (mrpExclGst * 0.5 * quantity) * (1 + (gstPercentage / 100))
                };
            
            // Prepare sale record
            const saleRecord: Omit<Sale, 'sale_id'> = {
              id: v4(),
              date: order.date,
              invoice_no: order.invoice_no,
              product_name: item.product_name,
              hsn_code: item.hsn_code,
              units: item.units,
              sales_qty: quantity,
              mrp_incl_gst: mrpInclGst,
              mrp_excl_gst: mrpExclGst,
              discount_on_sales_percentage: discountPercentage,
              discounted_sales_rate_excl_gst: discountedRateExclGst,
              gst_percentage: gstPercentage,
              taxable_value: taxableValue,
              igst: igst,
              cgst: cgst,
              sgst: sgst,
              invoice_value: invoiceValue,
              purchase_cost_per_unit_ex_gst: purchaseCost.purchase_cost_per_unit_ex_gst,
              purchase_gst_percentage: purchaseCost.purchase_gst_percentage,
              purchase_taxable_value: purchaseCost.purchase_cost_per_unit_ex_gst * quantity,
              purchase_igst: 0, // Add default value for missing property
              purchase_cgst: 0, // Add default value for missing property
              purchase_sgst: 0, // Add default value for missing property
              total_purchase_cost: purchaseCost.total_purchase_cost,
              created_at: new Date().toISOString()
            };
            
            // Insert sale record
            await supabase.from(TABLES.SALES).insert([saleRecord]);
            
            // Update processing stats
            setProcessingStats(prev => ({
              ...prev!,
              processed: prev!.processed + 1,
              succeeded: prev!.succeeded + 1
            }));
          } catch (error) {
            console.error('Error processing sales item:', error);
            setProcessingStats(prev => ({
              ...prev!,
              processed: prev!.processed + 1,
              failed: prev!.failed + 1,
              errors: [...prev!.errors, error]
            }));
          }
        }
      }
      
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SALES] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.BALANCE_STOCK] });
      
      setProcessingStats(prev => ({
        ...prev!,
        endTime: new Date()
      }));
    } catch (error) {
      console.error('Error syncing sales data:', error);
      throw error;
    } finally {
      setIsSyncingSales(false);
    }
  };

  // Function to sync consumption data from POS
  const syncConsumptionFromPos = async (startDate: string, endDate: string) => {
    setIsSyncingConsumption(true);
    setProcessingStats({
      startTime: new Date(),
      endTime: null,
      total: 0,
      processed: 0,
      succeeded: 0,
      failed: 0,
      errors: []
    });
    
    try {
      // For this example, we'll convert a percentage of existing sales into consumption
      // In a real application, you would fetch actual consumption data from your POS or inventory system
      
      // Fetch sales data within the date range
      const { data: salesData, error: salesError } = await supabase
        .from(TABLES.SALES)
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate);
      
      if (salesError) throw handleSupabaseError(salesError);
      
      // For demo purposes, select 30% of sales items to convert to consumption
      const selectedItems = salesData
        ? salesData.filter(() => Math.random() < 0.3)
        : [];
      
      setProcessingStats(prev => ({
        ...prev!,
        total: selectedItems.length
      }));
      
      // Process each selected item
      for (const [index, item] of selectedItems.entries()) {
        try {
          // Create consumption record based on sale data
          const consumptionRecord: Omit<Consumption, 'consumption_id'> = {
            id: v4(),
            date: item.date,
            requisition_voucher_no: `POS-${item.invoice_no}`,
            product_name: item.product_name,
            hsn_code: item.hsn_code,
            units: item.units,
            consumption_qty: Math.ceil(item.sales_qty * 0.5), // Use half of sales quantity for demo
            purchase_cost_per_unit_ex_gst: item.purchase_cost_per_unit_ex_gst,
            purchase_gst_percentage: item.purchase_gst_percentage,
            purchase_taxable_value: item.purchase_cost_per_unit_ex_gst * Math.ceil(item.sales_qty * 0.5),
            taxable_value: item.purchase_cost_per_unit_ex_gst * Math.ceil(item.sales_qty * 0.5),
            igst: 0, // Use default value
            cgst: 0, // Use default value
            sgst: 0, // Use default value
            invoice_value: (item.purchase_cost_per_unit_ex_gst * Math.ceil(item.sales_qty * 0.5)) * (1 + (item.purchase_gst_percentage / 100)),
            created_at: new Date().toISOString()
          };
          
          // Insert consumption record
          await supabase.from(TABLES.CONSUMPTION).insert([consumptionRecord]);
          
          // Update processing stats
          setProcessingStats(prev => ({
            ...prev!,
            processed: prev!.processed + 1,
            succeeded: prev!.succeeded + 1
          }));
          
          // For demo purposes, add a small delay between operations
          if (index < selectedItems.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        } catch (error) {
          console.error('Error processing consumption item:', error);
          setProcessingStats(prev => ({
            ...prev!,
            processed: prev!.processed + 1,
            failed: prev!.failed + 1,
            errors: [...prev!.errors, error]
          }));
        }
      }
      
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CONSUMPTION] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.BALANCE_STOCK] });
      
      setProcessingStats(prev => ({
        ...prev!,
        endTime: new Date()
      }));
    } catch (error) {
      console.error('Error syncing consumption data:', error);
      throw error;
    } finally {
      setIsSyncingConsumption(false);
    }
  };

  // Function to export inventory data for CSV
  const exportInventoryData = async (): Promise<InventoryExportData> => {
    setIsExporting(true);
    
    try {
      // Define explicit table names as fallback
      const tableNames = {
        purchases: TABLES.PURCHASES || 'inventory_purchases',
        sales: TABLES.SALES || 'inventory_sales',
        consumption: TABLES.CONSUMPTION || 'inventory_consumption',
        balanceStock: TABLES.BALANCE_STOCK || 'inventory_balance_stock'
      };
      
      console.log('Exporting data from tables:', tableNames);
      
      // Fetch all required data
      const [purchases, sales, consumption, balanceStock] = await Promise.all([
        supabase.from(tableNames.purchases).select('*').then(res => res.data || []),
        supabase.from(tableNames.sales).select('*').then(res => res.data || []),
        supabase.from(tableNames.consumption).select('*').then(res => res.data || []),
        supabase.from(tableNames.balanceStock).select('*').then(res => res.data || [])
      ]);
      
      return {
        purchases: purchases as Purchase[],
        sales: sales as Sale[],
        consumption: consumption as Consumption[],
        balanceStock: balanceStock as BalanceStock[]
      };
    } catch (error) {
      console.error('Error exporting inventory data:', error);
      throw error;
    } finally {
      setIsExporting(false);
    }
  };

  // Function to record salon consumption directly from POS
  const recordSalonConsumption = useMutation({
    mutationFn: async (items: SalonConsumptionItem[]) => {
      if (!items || items.length === 0) return { success: false, message: 'No items to record' };
      
      try {
        // Generate a shared requisition voucher number for all items
        const voucherNumber = items[0].requisition_voucher_no || `POS-SALON-${new Date().getTime()}`;
        const currentDate = items[0].date || new Date().toISOString();
        
        // Process each consumption item
        const consumptionRecords = [];
        for (const item of items) {
          // Get product details if needed
          let productDetails = { hsn_code: '', units: '' };
          
          // Try to find product details from purchases if they're not provided
          if (!item.hsn_code || !item.units) {
            const { data: purchaseData } = await supabase
              .from(TABLES.PURCHASES)
              .select('hsn_code, units')
              .eq('product_name', item.product_name)
              .order('date', { ascending: false })
              .limit(1);
              
            if (purchaseData && purchaseData.length > 0) {
              productDetails = {
                hsn_code: purchaseData[0].hsn_code || '',
                units: purchaseData[0].units || ''
              };
            }
          }
          
          // Prepare consumption record
          const consumptionRecord = {
            id: v4(),
            date: currentDate,
            product_name: item.product_name,
            hsn_code: item.hsn_code || productDetails.hsn_code,
            units: item.units || productDetails.units,
            requisition_voucher_no: voucherNumber,
            consumption_qty: item.quantity,
            purchase_cost_per_unit_ex_gst: item.unit_price ? item.unit_price / 1.18 : 0, // Estimating cost ex GST
            purchase_gst_percentage: 18, // Assuming standard 18% GST
            purchase_taxable_value: (item.unit_price ? item.unit_price / 1.18 : 0) * item.quantity,
            taxable_value: (item.unit_price ? item.unit_price / 1.18 : 0) * item.quantity,
            igst: 0,
            cgst: (item.unit_price ? (item.unit_price / 1.18) * 0.09 : 0) * item.quantity, // Half of 18% GST
            sgst: (item.unit_price ? (item.unit_price / 1.18) * 0.09 : 0) * item.quantity, // Half of 18% GST
            invoice_value: item.unit_price ? item.unit_price * item.quantity : 0,
            purpose: item.purpose,
            created_at: new Date().toISOString()
          };
          
          consumptionRecords.push(consumptionRecord);
        }
        
        // Insert all consumption records
        const { data, error } = await supabase
          .from(TABLES.CONSUMPTION)
          .insert(consumptionRecords);
          
        if (error) throw handleSupabaseError(error);
        
        // Return success
        return { 
          success: true, 
          message: `Successfully recorded ${consumptionRecords.length} items`,
          data: consumptionRecords
        };
      } catch (error) {
        console.error('Error recording salon consumption:', error);
        return { 
          success: false, 
          message: error instanceof Error ? error.message : 'Unknown error recording consumption',
          error
        };
      }
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CONSUMPTION] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.BALANCE_STOCK] });
    },
    onError: (error) => {
      console.error('Error in consumption mutation:', error);
    }
  });

  return {
    // Queries
    purchasesQuery,
    salesQuery,
    consumptionQuery,
    balanceStockQuery,
    
    // Create purchase
    createPurchase,
    isCreatingPurchase,
    
    // Sync sales
    syncSalesFromPos,
    isSyncingSales,
    
    // Sync consumption
    syncConsumptionFromPos,
    isSyncingConsumption,
    
    // Export data
    exportInventoryData,
    isExporting,
    
    // Processing stats for UI feedback
    processingStats,
    
    // Add the new function to the exports
    recordSalonConsumption: recordSalonConsumption.mutateAsync
  };
};