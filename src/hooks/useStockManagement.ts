import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';

// Types for stock management
export interface Product {
  id: string;
  name: string;
  hsn_code: string;
  unit: string;
  created_at?: string;
}

export interface Purchase {
  id: string;
  product_id: string;
  date: string;
  invoice_no: string;
  qty: number;
  incl_gst: number;
  ex_gst: number;
  taxable_value: number;
  igst: number;
  cgst: number;
  sgst: number;
  invoice_value: number;
  supplier: string;
  transaction_type: 'purchase';
  created_at?: string;
}

export interface Sale {
  id: string;
  product_id: string;
  date: string;
  invoice_no: string;
  qty: number;
  incl_gst: number;
  ex_gst: number;
  taxable_value: number;
  igst: number;
  cgst: number;
  sgst: number;
  invoice_value: number;
  customer: string;
  payment_method: 'cash' | 'card' | 'online' | 'other';
  transaction_type: 'sale';
  converted_to_consumption: boolean;
  converted_at?: string;
  consumption_id?: string;
  created_at?: string;
}

export interface Consumption {
  id: string;
  product_id: string;
  date: string;
  qty: number;
  purpose: string;
  transaction_type: 'consumption';
  original_sale_id?: string;
  created_at?: string;
}

export interface BalanceStock {
  id: string;
  product_id: string;
  qty: number;
  created_at?: string;
  updated_at?: string;
}

export interface ProcessedStats {
  products: number;
  purchases: number;
  sales: number;
  consumption: number;
}

export interface StockExcelData {
  purchases: Purchase[];
  sales: Sale[];
  consumption: Consumption[];
  balance: BalanceStock[];
  uniqueProducts: Product[];
}

export function useStockManagement() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<ProcessedStats | null>(null);
  const [cashSales, setCashSales] = useState<Sale[]>([]);
  const [cashSalesLoading, setCashSalesLoading] = useState(false);

  // Helper function to standardize unit codes
  const standardizeUnit = (unitStr: string): string => {
    const unitMappings: Record<string, string> = {
      'BTL-BOTTLES': 'BTL',
      'PCS-PIECES': 'PCS',
      'BOX-BOXES': 'BOX',
      'JAR-JARS': 'JAR',
      'PKT-PACKETS': 'PKT'
    };
    
    for (const [key, value] of Object.entries(unitMappings)) {
      if (unitStr.includes(key)) {
        return value;
      }
    }
    return unitStr;
  };

  // Helper function to fix floating point errors
  const fixFloatingPointErrors = (value: number): number => {
    if (Math.abs(value) < 1e-10) {
      return 0;
    }
    return Number(value.toFixed(2));
  };

  // Process the uploaded Excel file
  const processExcelFile = async (file: File): Promise<StockExcelData | null> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Ensure the workbook has the expected sheet
          if (!workbook.SheetNames.includes('STOCK DETAILS')) {
            reject(new Error('Excel file must contain a sheet named "STOCK DETAILS"'));
            return;
          }
          
          const worksheet = workbook.Sheets['STOCK DETAILS'];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          if (!jsonData || jsonData.length === 0) {
            reject(new Error('No data found in the STOCK DETAILS sheet'));
            return;
          }
          
          // Process the data to extract the different sections
          const purchases: Purchase[] = [];
          const sales: Sale[] = [];
          const consumption: Consumption[] = [];
          const balance: BalanceStock[] = [];
          const products: Record<string, Product> = {};
          
          // Find the sections in the data
          let currentSection: 'none' | 'purchase' | 'sales' | 'consumption' | 'balance' = 'none';
          
          for (let i = 0; i < jsonData.length; i++) {
            const row = jsonData[i] as any;
            
            // Determine the current section
            if (row['Product Name'] === 'PURCHASE - STOCK IN') {
              currentSection = 'purchase';
              continue;
            } else if (row['Product Name'] === 'SALES TO CUSTOMER - STOCK OUT') {
              currentSection = 'sales';
              continue;
            } else if (row['Product Name'] === 'SALON CONSUMPTION - STOCK OUT') {
              currentSection = 'consumption';
              continue;
            } else if (row['Product Name'] === 'BALANCE STOCK') {
              currentSection = 'balance';
              continue;
            }
            
            // Skip rows without product name
            if (!row['Product Name']) continue;
            
            // Create a unique key for the product
            const productKey = `${row['Product Name']}|${row['HSN Code'] || ''}`;
            
            // Add product if it doesn't exist
            if (!products[productKey]) {
              products[productKey] = {
                id: uuidv4(),
                name: row['Product Name'],
                hsn_code: row['HSN Code'] || '',
                unit: standardizeUnit(row['UNITS'] || '')
              };
            }
            
            const productId = products[productKey].id;
            
            // Process the row based on the current section
            if (currentSection === 'purchase') {
              purchases.push({
                id: uuidv4(),
                product_id: productId,
                date: row['Date'] || new Date().toISOString().split('T')[0],
                invoice_no: row['Invoice No.'] || '',
                qty: fixFloatingPointErrors(row['Qty.'] || 0),
                incl_gst: fixFloatingPointErrors(row['Incl. GST'] || 0),
                ex_gst: fixFloatingPointErrors(row['Ex. GST'] || 0),
                taxable_value: fixFloatingPointErrors(row['Taxable Value'] || 0),
                igst: fixFloatingPointErrors(row['IGST'] || 0),
                cgst: fixFloatingPointErrors(row['CGST'] || 0),
                sgst: fixFloatingPointErrors(row['SGST'] || 0),
                invoice_value: fixFloatingPointErrors(row['Invoice Value'] || 0),
                supplier: row['Supplier'] || '',
                transaction_type: 'purchase'
              });
            } else if (currentSection === 'sales') {
              sales.push({
                id: uuidv4(),
                product_id: productId,
                date: row['Date'] || new Date().toISOString().split('T')[0],
                invoice_no: row['Invoice No.'] || '',
                qty: fixFloatingPointErrors(row['Qty.'] || 0),
                incl_gst: fixFloatingPointErrors(row['Incl. GST'] || 0),
                ex_gst: fixFloatingPointErrors(row['Ex. GST'] || 0),
                taxable_value: fixFloatingPointErrors(row['Taxable Value'] || 0),
                igst: fixFloatingPointErrors(row['IGST'] || 0),
                cgst: fixFloatingPointErrors(row['CGST'] || 0),
                sgst: fixFloatingPointErrors(row['SGST'] || 0),
                invoice_value: fixFloatingPointErrors(row['Invoice Value'] || 0),
                customer: row['Customer'] || '',
                payment_method: row['Payment Method'] || 'cash',
                transaction_type: 'sale',
                converted_to_consumption: false
              });
            } else if (currentSection === 'consumption') {
              consumption.push({
                id: uuidv4(),
                product_id: productId,
                date: row['Date'] || new Date().toISOString().split('T')[0],
                qty: fixFloatingPointErrors(row['Qty.'] || 0),
                purpose: row['Purpose'] || '',
                transaction_type: 'consumption'
              });
            } else if (currentSection === 'balance') {
              balance.push({
                id: uuidv4(),
                product_id: productId,
                qty: fixFloatingPointErrors(row['Qty'] || 0)
              });
            }
          }
          
          resolve({
            purchases,
            sales,
            consumption,
            balance,
            uniqueProducts: Object.values(products)
          });
        } catch (err: any) {
          reject(new Error(`Error processing Excel file: ${err.message}`));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Error reading the file'));
      };
      
      reader.readAsArrayBuffer(file);
    });
  };

  // Extract stock data from Excel file and save to Supabase
  const extractStockData = async (file: File) => {
    setLoading(true);
    setError(null);
    setStats(null);
    
    try {
      // Process the Excel file
      const data = await processExcelFile(file);
      
      if (!data) {
        throw new Error('Failed to process Excel file');
      }
      
      // Store data in Supabase
      
      // 1. Insert products
      for (const product of data.uniqueProducts) {
        // Check if product already exists
        const { data: existingProducts, error: queryError } = await supabase
          .from('products')
          .select('id')
          .eq('name', product.name)
          .eq('hsn_code', product.hsn_code);
          
        if (queryError) throw new Error(`Error checking for existing product: ${queryError.message}`);
        
        if (existingProducts && existingProducts.length > 0) {
          // Update existing product
          const { error: updateError } = await supabase
            .from('products')
            .update({ unit: product.unit })
            .eq('id', existingProducts[0].id);
            
          if (updateError) throw new Error(`Error updating product: ${updateError.message}`);
        } else {
          // Insert new product
          const { error: insertError } = await supabase
            .from('products')
            .insert([{
              id: product.id,
              name: product.name,
              hsn_code: product.hsn_code,
              unit: product.unit,
              created_at: new Date().toISOString()
            }]);
            
          if (insertError) throw new Error(`Error inserting product: ${insertError.message}`);
        }
      }
      
      // 2. Insert purchases
      if (data.purchases.length > 0) {
        const { error: purchasesError } = await supabase
          .from('purchases')
          .insert(data.purchases.map(p => ({
            ...p,
            created_at: new Date().toISOString()
          })));
          
        if (purchasesError) throw new Error(`Error inserting purchases: ${purchasesError.message}`);
      }
      
      // 3. Insert sales
      if (data.sales.length > 0) {
        const { error: salesError } = await supabase
          .from('sales')
          .insert(data.sales.map(s => ({
            ...s,
            created_at: new Date().toISOString()
          })));
          
        if (salesError) throw new Error(`Error inserting sales: ${salesError.message}`);
      }
      
      // 4. Insert consumption
      if (data.consumption.length > 0) {
        const { error: consumptionError } = await supabase
          .from('consumption')
          .insert(data.consumption.map(c => ({
            ...c,
            created_at: new Date().toISOString()
          })));
          
        if (consumptionError) throw new Error(`Error inserting consumption: ${consumptionError.message}`);
      }
      
      // 5. Update balance stock
      for (const balance of data.balance) {
        // Check if balance already exists for the product
        const { data: existingBalance, error: queryError } = await supabase
          .from('balance_stock')
          .select('id')
          .eq('product_id', balance.product_id);
          
        if (queryError) throw new Error(`Error checking for existing balance: ${queryError.message}`);
        
        if (existingBalance && existingBalance.length > 0) {
          // Update existing balance
          const { error: updateError } = await supabase
            .from('balance_stock')
            .update({ 
              qty: balance.qty,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingBalance[0].id);
            
          if (updateError) throw new Error(`Error updating balance: ${updateError.message}`);
        } else {
          // Insert new balance
          const { error: insertError } = await supabase
            .from('balance_stock')
            .insert([{
              id: balance.id,
              product_id: balance.product_id,
              qty: balance.qty,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }]);
            
          if (insertError) throw new Error(`Error inserting balance: ${insertError.message}`);
        }
      }
      
      // Set success stats
      setStats({
        products: data.uniqueProducts.length,
        purchases: data.purchases.length,
        sales: data.sales.length,
        consumption: data.consumption.length
      });
      
      toast.success('Stock data extracted and stored successfully');
    } catch (err: any) {
      setError(err.message);
      toast.error(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch cash sales that haven't been converted to consumption
  const fetchCashSales = async () => {
    setCashSalesLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          products:product_id (
            name,
            hsn_code,
            unit
          )
        `)
        .eq('payment_method', 'cash')
        .eq('converted_to_consumption', false)
        .order('date', { ascending: false });
        
      if (error) throw new Error(`Error fetching cash sales: ${error.message}`);
      
      if (data) {
        // Format the data to match the expected structure
        const formattedCashSales = data.map(sale => ({
          ...sale,
          product_name: sale.products?.name || '',
          hsn_code: sale.products?.hsn_code || '',
          unit: sale.products?.unit || ''
        }));
        
        setCashSales(formattedCashSales);
      }
    } catch (err: any) {
      setError(err.message);
      toast.error(`Error: ${err.message}`);
    } finally {
      setCashSalesLoading(false);
    }
  };

  // Convert cash sales to consumption
  const convertTransactions = async (transactionIds: string[]) => {
    setLoading(true);
    setError(null);
    
    try {
      // We'll use a transaction for this operation to ensure consistency
      // Since Supabase doesn't support native transactions, we need to be careful
      // and handle potential issues
      
      let convertedCount = 0;
      
      // For each selected transaction
      for (const saleId of transactionIds) {
        // 1. Get the sale details
        const { data: saleData, error: saleError } = await supabase
          .from('sales')
          .select('*')
          .eq('id', saleId)
          .eq('payment_method', 'cash')
          .eq('converted_to_consumption', false)
          .single();
          
        if (saleError) throw new Error(`Error fetching sale: ${saleError.message}`);
        if (!saleData) throw new Error(`Sale not found: ${saleId}`);
        
        // 2. Create a new consumption record
        const consumptionId = uuidv4();
        const { error: consumptionError } = await supabase
          .from('consumption')
          .insert([{
            id: consumptionId,
            product_id: saleData.product_id,
            date: saleData.date,
            qty: saleData.qty,
            purpose: 'Converted from cash sale',
            transaction_type: 'consumption',
            original_sale_id: saleId,
            created_at: new Date().toISOString()
          }]);
          
        if (consumptionError) throw new Error(`Error creating consumption: ${consumptionError.message}`);
        
        // 3. Update the sale record to mark it as converted
        const { error: updateError } = await supabase
          .from('sales')
          .update({
            converted_to_consumption: true,
            converted_at: new Date().toISOString(),
            consumption_id: consumptionId
          })
          .eq('id', saleId);
          
        if (updateError) throw new Error(`Error updating sale: ${updateError.message}`);
        
        convertedCount++;
      }
      
      toast.success(`Successfully converted ${convertedCount} transaction(s)`);
      
      // Refresh the cash sales list
      await fetchCashSales();
      
      return convertedCount;
    } catch (err: any) {
      setError(err.message);
      toast.error(`Error: ${err.message}`);
      return 0;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    stats,
    cashSales,
    cashSalesLoading,
    extractStockData,
    fetchCashSales,
    convertTransactions
  };
} 