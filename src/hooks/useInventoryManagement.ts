import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import { 
  Product, 
  Purchase, 
  Sale, 
  Consumption, 
  BalanceStock,
  ProcessingStats,
  ExcelData
} from '../models/inventoryTypes';
import { parseStockDetailsExcel } from '../utils/excelParser';
import { exportInventoryToExcel } from '../utils/excelExporter';
import { useQuery, useQueryClient } from '@tanstack/react-query';

// Hook for inventory management functions
export function useInventoryManagement() {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<ProcessingStats | null>(null);
  const queryClient = useQueryClient();

  // Fetch all products
  const fetchProducts = async (): Promise<Product[]> => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data as Product[];
  };

  // Fetch product by ID
  const fetchProduct = async (id: string): Promise<Product | null> => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) return null;
    return data as Product;
  };

  // Create a new product
  const createProduct = async (product: Omit<Product, 'id' | 'created_at'>): Promise<Product> => {
    const newProduct = {
      id: uuidv4(),
      ...product,
      created_at: new Date().toISOString(),
    };
    
    const { data, error } = await supabase
      .from('products')
      .insert([newProduct])
      .select()
      .single();
    
    if (error) throw error;
    
    // Invalidate products query cache
    queryClient.invalidateQueries(['products']);
    
    return data as Product;
  };

  // Update a product
  const updateProduct = async (product: Product): Promise<Product> => {
    const { data, error } = await supabase
      .from('products')
      .update(product)
      .eq('id', product.id)
      .select()
      .single();
    
    if (error) throw error;
    
    // Invalidate products query cache
    queryClient.invalidateQueries(['products']);
    queryClient.invalidateQueries(['product', product.id]);
    
    return data as Product;
  };

  // Delete a product
  const deleteProduct = async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    // Invalidate products query cache
    queryClient.invalidateQueries(['products']);
  };

  // Fetch all purchases
  const fetchPurchases = async (): Promise<Purchase[]> => {
    const { data, error } = await supabase
      .from('purchases')
      .select(`
        *,
        product:product_id (
          id, 
          name, 
          hsn_code, 
          units
        )
      `)
      .order('date', { ascending: false });
    
    if (error) throw error;
    return data as Purchase[];
  };

  // Create a new purchase
  const createPurchase = async (purchase: Omit<Purchase, 'id' | 'created_at'>): Promise<Purchase> => {
    const newPurchase = {
      id: uuidv4(),
      ...purchase,
      created_at: new Date().toISOString(),
    };
    
    const { data, error } = await supabase
      .from('purchases')
      .insert([newPurchase])
      .select()
      .single();
    
    if (error) throw error;
    
    // Update balance stock
    await updateBalanceStock(purchase.product_id);
    
    // Invalidate purchases query cache
    queryClient.invalidateQueries(['purchases']);
    
    return data as Purchase;
  };

  // Fetch all sales
  const fetchSales = async (): Promise<Sale[]> => {
    const { data, error } = await supabase
      .from('sales')
      .select(`
        *,
        product:product_id (
          id, 
          name, 
          hsn_code, 
          units
        )
      `)
      .order('date', { ascending: false });
    
    if (error) throw error;
    return data as Sale[];
  };

  // Create a new sale
  const createSale = async (sale: Omit<Sale, 'id' | 'created_at'>): Promise<Sale> => {
    const newSale = {
      id: uuidv4(),
      ...sale,
      created_at: new Date().toISOString(),
    };
    
    const { data, error } = await supabase
      .from('sales')
      .insert([newSale])
      .select()
      .single();
    
    if (error) throw error;
    
    // Update balance stock
    await updateBalanceStock(sale.product_id);
    
    // Invalidate sales query cache
    queryClient.invalidateQueries(['sales']);
    
    return data as Sale;
  };

  // Fetch all consumption
  const fetchConsumption = async (): Promise<Consumption[]> => {
    const { data, error } = await supabase
      .from('consumption')
      .select(`
        *,
        product:product_id (
          id, 
          name, 
          hsn_code, 
          units
        )
      `)
      .order('date', { ascending: false });
    
    if (error) throw error;
    return data as Consumption[];
  };

  // Create a new consumption
  const createConsumption = async (consumption: Omit<Consumption, 'id' | 'created_at'>): Promise<Consumption> => {
    const newConsumption = {
      id: uuidv4(),
      ...consumption,
      created_at: new Date().toISOString(),
    };
    
    const { data, error } = await supabase
      .from('consumption')
      .insert([newConsumption])
      .select()
      .single();
    
    if (error) throw error;
    
    // Update balance stock
    await updateBalanceStock(consumption.product_id);
    
    // Invalidate consumption query cache
    queryClient.invalidateQueries(['consumption']);
    
    return data as Consumption;
  };

  // Fetch balance stock
  const fetchBalanceStock = async (): Promise<BalanceStock[]> => {
    const { data, error } = await supabase
      .from('balance_stock')
      .select(`
        *,
        product:product_id (
          id, 
          name, 
          hsn_code, 
          units
        )
      `)
      .order('product_id');
    
    if (error) throw error;
    return data as BalanceStock[];
  };

  // Update balance stock for a product
  const updateBalanceStock = async (productId: string): Promise<void> => {
    try {
      // Fetch all purchases, sales, and consumption for this product
      const [purchases, sales, consumption] = await Promise.all([
        supabase
          .from('purchases')
          .select('*')
          .eq('product_id', productId),
        supabase
          .from('sales')
          .select('*')
          .eq('product_id', productId),
        supabase
          .from('consumption')
          .select('*')
          .eq('product_id', productId)
      ]);
      
      if (purchases.error) throw purchases.error;
      if (sales.error) throw sales.error;
      if (consumption.error) throw consumption.error;
      
      // Calculate balance quantity
      const totalPurchaseQty = purchases.data.reduce((sum, p) => sum + p.qty, 0);
      const totalSalesQty = sales.data.reduce((sum, s) => sum + s.qty, 0);
      const totalConsumptionQty = consumption.data.reduce((sum, c) => sum + c.qty, 0);
      
      const balanceQty = totalPurchaseQty - (totalSalesQty + totalConsumptionQty);
      
      // Calculate average cost and taxable value
      let balanceValue = 0;
      let balanceGst = 0;
      let balanceCgst = 0;
      let balanceSgst = 0;
      let balanceIgst = 0;
      let balanceInvoiceValue = 0;
      
      if (purchases.data.length > 0 && balanceQty > 0) {
        const totalPurchaseValue = purchases.data.reduce((sum, p) => sum + p.taxable_value, 0);
        const avgCostPerUnit = totalPurchaseValue / totalPurchaseQty;
        
        balanceValue = balanceQty * avgCostPerUnit;
        balanceGst = purchases.data[0].gst_percentage; // Use GST from latest purchase
        
        if (balanceGst > 0) {
          if (balanceGst >= 0.1) { // Assuming it's in percentage, not decimal
            balanceCgst = balanceValue * (balanceGst / 2) / 100;
            balanceSgst = balanceValue * (balanceGst / 2) / 100;
          } else {
            balanceIgst = balanceValue * balanceGst;
          }
        }
        
        balanceInvoiceValue = balanceValue + balanceIgst + balanceCgst + balanceSgst;
      }
      
      // Check if balance stock already exists for this product
      const existingBalance = await supabase
        .from('balance_stock')
        .select('*')
        .eq('product_id', productId)
        .maybeSingle();
      
      if (existingBalance.error) throw existingBalance.error;
      
      if (existingBalance.data) {
        // Update existing balance stock
        await supabase
          .from('balance_stock')
          .update({
            qty: balanceQty,
            taxable_value: balanceValue,
            igst: balanceIgst,
            cgst: balanceCgst,
            sgst: balanceSgst,
            invoice_value: balanceInvoiceValue,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingBalance.data.id);
      } else if (balanceQty > 0) {
        // Create new balance stock
        await supabase
          .from('balance_stock')
          .insert([{
            id: uuidv4(),
            product_id: productId,
            qty: balanceQty,
            taxable_value: balanceValue,
            igst: balanceIgst,
            cgst: balanceCgst,
            sgst: balanceSgst,
            invoice_value: balanceInvoiceValue,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);
      }
      
      // Invalidate balance stock query cache
      queryClient.invalidateQueries(['balance_stock']);
      
    } catch (err) {
      console.error('Error updating balance stock:', err);
      throw err;
    }
  };

  // Function to extract stock data from Excel
  const extractStockData = async (file: File): Promise<ProcessingStats> => {
    if (!file) {
      setError('No file selected');
      throw new Error('No file selected');
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Parse the Excel file
      const excelData: ExcelData = await parseStockDetailsExcel(file);
      
      // Initialize stats
      const processingStats: ProcessingStats = {
        productsProcessed: 0,
        purchasesProcessed: 0,
        salesProcessed: 0,
        consumptionProcessed: 0,
        balanceStockUpdated: 0
      };
      
      // Process products
      for (const product of excelData.products) {
        // Check if product already exists
        const existingProduct = await supabase
          .from('products')
          .select('*')
          .eq('name', product.name)
          .eq('hsn_code', product.hsn_code)
          .maybeSingle();
        
        if (existingProduct.error) throw existingProduct.error;
        
        if (existingProduct.data) {
          // Use existing product ID
          product.id = existingProduct.data.id;
        } else {
          // Insert new product
          const { error } = await supabase
            .from('products')
            .insert([product]);
          
          if (error) throw error;
          processingStats.productsProcessed++;
        }
      }
      
      // Process purchases
      for (const purchase of excelData.purchases) {
        const { error } = await supabase
          .from('purchases')
          .insert([purchase]);
        
        if (error) throw error;
        processingStats.purchasesProcessed++;
      }
      
      // Process sales
      for (const sale of excelData.sales) {
        const { error } = await supabase
          .from('sales')
          .insert([sale]);
        
        if (error) throw error;
        processingStats.salesProcessed++;
      }
      
      // Process consumption
      for (const consumptionItem of excelData.consumption) {
        const { error } = await supabase
          .from('consumption')
          .insert([consumptionItem]);
        
        if (error) throw error;
        processingStats.consumptionProcessed++;
      }
      
      // Update balance stock for all products
      const productIds = new Set([
        ...excelData.purchases.map(p => p.product_id),
        ...excelData.sales.map(s => s.product_id),
        ...excelData.consumption.map(c => c.product_id)
      ]);
      
      for (const productId of Array.from(productIds)) {
        await updateBalanceStock(productId);
        processingStats.balanceStockUpdated++;
      }
      
      // Invalidate all relevant query caches
      queryClient.invalidateQueries(['products']);
      queryClient.invalidateQueries(['purchases']);
      queryClient.invalidateQueries(['sales']);
      queryClient.invalidateQueries(['consumption']);
      queryClient.invalidateQueries(['balance_stock']);
      
      setStats(processingStats);
      return processingStats;
      
    } catch (err: any) {
      console.error('Error processing Excel file:', err);
      setError(err.message || 'Failed to process Excel file');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Function to export inventory data
  const exportInventoryData = async (filename?: string): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch all data
      const [products, purchases, sales, consumption, balanceStock] = await Promise.all([
        fetchProducts(),
        fetchPurchases(),
        fetchSales(),
        fetchConsumption(),
        fetchBalanceStock()
      ]);
      
      // Export to Excel
      exportInventoryToExcel(
        products,
        purchases,
        sales,
        consumption,
        balanceStock,
        filename
      );
      
    } catch (err: any) {
      console.error('Error exporting inventory data:', err);
      setError(err.message || 'Failed to export inventory data');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Handle manual inventory form submission
  const handleInventoryFormSubmit = async (
    type: 'purchase' | 'sale' | 'consumption',
    data: any
  ): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      switch (type) {
        case 'purchase':
          await createPurchase(data);
          break;
        case 'sale':
          await createSale(data);
          break;
        case 'consumption':
          await createConsumption(data);
          break;
      }
    } catch (err: any) {
      console.error(`Error creating ${type}:`, err);
      setError(err.message || `Failed to create ${type}`);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Integrate with POS data
  const syncPosData = async (): Promise<number> => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch recent POS sales data
      const { data: posData, error: posError } = await supabase
        .from('pos_sales')
        .select('*')
        .eq('is_product', true) // Only get product sales, not services
        .eq('synced_to_inventory', false); // Only get unsynced records
      
      if (posError) throw posError;
      
      let syncedCount = 0;
      
      // Process each POS sale
      for (const posSale of posData) {
        // Find the product
        const product = await fetchProduct(posSale.product_id);
        if (!product) continue;
        
        // Create a new sale record
        const sale: Omit<Sale, 'id' | 'created_at'> = {
          date: posSale.created_at,
          product_id: posSale.product_id,
          invoice_no: posSale.invoice_no,
          qty: posSale.quantity,
          purchase_cost_per_unit_ex_gst: posSale.cost_price || 0,
          purchase_gst_percentage: posSale.gst_percentage || 0,
          purchase_taxable_value: (posSale.cost_price || 0) * posSale.quantity,
          purchase_igst: 0,
          purchase_cgst: 0,
          purchase_sgst: 0,
          total_purchase_cost: 0,
          mrp_incl_gst: posSale.price_incl_tax,
          mrp_ex_gst: posSale.price_excl_tax,
          discount_percentage: posSale.discount_percentage || 0,
          discounted_sales_rate_ex_gst: posSale.discounted_price_excl_tax || posSale.price_excl_tax,
          sales_gst_percentage: posSale.gst_percentage || 0,
          sales_taxable_value: (posSale.discounted_price_excl_tax || posSale.price_excl_tax) * posSale.quantity,
          sales_igst: 0,
          sales_cgst: 0,
          sales_sgst: 0,
          invoice_value: posSale.total_amount
        };
        
        // Calculate GST amounts
        if (sale.purchase_gst_percentage > 0) {
          sale.purchase_cgst = sale.purchase_taxable_value * (sale.purchase_gst_percentage / 2) / 100;
          sale.purchase_sgst = sale.purchase_taxable_value * (sale.purchase_gst_percentage / 2) / 100;
        }
        
        if (sale.sales_gst_percentage > 0) {
          sale.sales_cgst = sale.sales_taxable_value * (sale.sales_gst_percentage / 2) / 100;
          sale.sales_sgst = sale.sales_taxable_value * (sale.sales_gst_percentage / 2) / 100;
        }
        
        sale.total_purchase_cost = sale.purchase_taxable_value + sale.purchase_cgst + sale.purchase_sgst;
        
        // Create the sale record
        await createSale(sale);
        
        // Mark POS sale as synced
        await supabase
          .from('pos_sales')
          .update({ synced_to_inventory: true })
          .eq('id', posSale.id);
        
        syncedCount++;
      }
      
      return syncedCount;
      
    } catch (err: any) {
      console.error('Error syncing POS data:', err);
      setError(err.message || 'Failed to sync POS data');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    // State
    loading,
    error,
    stats,
    
    // Data fetching
    fetchProducts,
    fetchProduct,
    fetchPurchases,
    fetchSales,
    fetchConsumption,
    fetchBalanceStock,
    
    // CRUD operations
    createProduct,
    updateProduct,
    deleteProduct,
    createPurchase,
    createSale,
    createConsumption,
    
    // Stock management
    updateBalanceStock,
    extractStockData,
    exportInventoryData,
    handleInventoryFormSubmit,
    syncPosData
  };
} 