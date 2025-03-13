import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Alert, 
  Paper, 
  CircularProgress,
  Divider,
  Chip
} from '@mui/material';
import { 
  FileDownload as FileDownloadIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import * as XLSX from 'xlsx';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../supabaseClient';

// Define types for our data
interface Product {
  id: string;
  name: string;
  hsn_code: string;
  unit: string;
}

interface Purchase {
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
  transaction_type: string;
  created_at: string;
  product?: Product;
}

interface Sale {
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
  payment_method: string;
  transaction_type: string;
  created_at: string;
  product?: Product;
}

interface Consumption {
  id: string;
  product_id: string;
  date: string;
  qty: number;
  purpose: string;
  transaction_type: string;
  created_at: string;
  product?: Product;
}

interface InventoryTransaction {
  'Transaction Type': string;
  'Date': string;
  'Product Name': string;
  'HSN Code': string;
  'UNITS': string;
  'Invoice No.': string;
  'Qty.': number;
  'Incl. GST': number;
  'Ex. GST': number;
  'Taxable Value': number;
  'IGST': number;
  'CGST': number;
  'SGST': number;
  'Invoice Value': number;
  'Supplier/Customer': string;
  'Payment Method': string;
  'Purpose': string;
}

const InventoryExport: React.FC = () => {
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch products
  const { data: products, isLoading: productsLoading, error: productsError } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select('*');
      if (error) throw error;
      return data as Product[];
    }
  });

  // Fetch purchases
  const { data: purchases, isLoading: purchasesLoading, error: purchasesError } = useQuery({
    queryKey: ['purchases'],
    queryFn: async () => {
      const { data, error } = await supabase.from('purchases').select('*');
      if (error) throw error;
      
      // Add product details to each purchase
      if (data && products) {
        return data.map(purchase => {
          const product = products.find(p => p.id === purchase.product_id);
          return { ...purchase, product };
        });
      }
      
      return data as Purchase[];
    },
    enabled: !!products
  });

  // Fetch sales
  const { data: sales, isLoading: salesLoading, error: salesError } = useQuery({
    queryKey: ['sales'],
    queryFn: async () => {
      const { data, error } = await supabase.from('sales').select('*');
      if (error) throw error;
      
      // Add product details to each sale
      if (data && products) {
        return data.map(sale => {
          const product = products.find(p => p.id === sale.product_id);
          return { ...sale, product };
        });
      }
      
      return data as Sale[];
    },
    enabled: !!products
  });

  // Fetch consumption data (salon usage)
  const { data: consumption, isLoading: consumptionLoading, error: consumptionError } = useQuery({
    queryKey: ['consumption'],
    queryFn: async () => {
      const { data, error } = await supabase.from('consumption').select('*');
      if (error) throw error;
      
      // Add product details to each consumption record
      if (data && products) {
        return data.map(usage => {
          const product = products.find(p => p.id === usage.product_id);
          return { ...usage, product };
        });
      }
      
      return data as Consumption[];
    },
    enabled: !!products
  });

  const isLoading = productsLoading || purchasesLoading || salesLoading || consumptionLoading;
  const anyError = productsError || purchasesError || salesError || consumptionError;

  const transformPurchases = (purchases: Purchase[]): InventoryTransaction[] => {
    return purchases.map(purchase => ({
      'Transaction Type': 'PURCHASE',
      'Date': purchase.date || '',
      'Product Name': purchase.product?.name || '',
      'HSN Code': purchase.product?.hsn_code || '',
      'UNITS': purchase.product?.unit || '',
      'Invoice No.': purchase.invoice_no || '',
      'Qty.': purchase.qty || 0,
      'Incl. GST': purchase.incl_gst || 0,
      'Ex. GST': purchase.ex_gst || 0,
      'Taxable Value': purchase.taxable_value || 0,
      'IGST': purchase.igst || 0,
      'CGST': purchase.cgst || 0,
      'SGST': purchase.sgst || 0,
      'Invoice Value': purchase.invoice_value || 0,
      'Supplier/Customer': purchase.supplier || '',
      'Payment Method': '',
      'Purpose': ''
    }));
  };

  const transformSales = (sales: Sale[]): InventoryTransaction[] => {
    return sales.map(sale => ({
      'Transaction Type': 'SALE',
      'Date': sale.date || '',
      'Product Name': sale.product?.name || '',
      'HSN Code': sale.product?.hsn_code || '',
      'UNITS': sale.product?.unit || '',
      'Invoice No.': sale.invoice_no || '',
      'Qty.': sale.qty || 0,
      'Incl. GST': sale.incl_gst || 0,
      'Ex. GST': sale.ex_gst || 0,
      'Taxable Value': sale.taxable_value || 0,
      'IGST': sale.igst || 0,
      'CGST': sale.cgst || 0,
      'SGST': sale.sgst || 0,
      'Invoice Value': sale.invoice_value || 0,
      'Supplier/Customer': sale.customer || '',
      'Payment Method': sale.payment_method || '',
      'Purpose': ''
    }));
  };

  const transformConsumption = (consumption: Consumption[]): InventoryTransaction[] => {
    return consumption.map(usage => ({
      'Transaction Type': 'CONSUMPTION',
      'Date': usage.date || '',
      'Product Name': usage.product?.name || '',
      'HSN Code': usage.product?.hsn_code || '',
      'UNITS': usage.product?.unit || '',
      'Invoice No.': '',
      'Qty.': usage.qty || 0,
      'Incl. GST': 0,
      'Ex. GST': 0,
      'Taxable Value': 0,
      'IGST': 0,
      'CGST': 0,
      'SGST': 0,
      'Invoice Value': 0,
      'Supplier/Customer': '',
      'Payment Method': '',
      'Purpose': usage.purpose || ''
    }));
  };

  // Handle export
  const handleExport = () => {
    try {
      setExporting(true);
      setError(null);
      setExported(false);

      // Combine all transactions
      const allTransactions: InventoryTransaction[] = [
        ...(purchases ? transformPurchases(purchases) : []),
        ...(sales ? transformSales(sales) : []),
        ...(consumption ? transformConsumption(consumption) : [])
      ];

      if (allTransactions.length === 0) {
        setError('No transactions found to export');
        setExporting(false);
        return;
      }

      // Create a new workbook
      const wb = XLSX.utils.book_new();

      // Create a worksheet with all transactions
      const ws = XLSX.utils.json_to_sheet(allTransactions, {
        header: [
          'Transaction Type',
          'Date',
          'Product Name',
          'HSN Code',
          'UNITS',
          'Invoice No.',
          'Qty.',
          'Incl. GST',
          'Ex. GST',
          'Taxable Value',
          'IGST',
          'CGST',
          'SGST',
          'Invoice Value',
          'Supplier/Customer',
          'Payment Method',
          'Purpose'
        ]
      });

      // Set column widths
      const wscols = [
        { wch: 15 }, // Transaction Type
        { wch: 15 }, // Date
        { wch: 30 }, // Product Name
        { wch: 12 }, // HSN Code
        { wch: 10 }, // UNITS
        { wch: 25 }, // Invoice No.
        { wch: 15 }, // Qty.
        { wch: 18 }, // Incl. GST
        { wch: 18 }, // Ex. GST
        { wch: 22 }, // Taxable Value
        { wch: 15 }, // IGST
        { wch: 15 }, // CGST
        { wch: 15 }, // SGST
        { wch: 22 }, // Invoice Value
        { wch: 30 }, // Supplier/Customer
        { wch: 25 }, // Payment Method
        { wch: 30 }  // Purpose
      ];
      ws['!cols'] = wscols;

      // Add the worksheet to the workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Inventory Transactions');

      // Generate a filename with current date
      const currentDate = new Date().toISOString().split('T')[0];
      XLSX.writeFile(wb, `Salon_Inventory_Transactions_${currentDate}.xlsx`);

      setExported(true);
    } catch (err: any) {
      console.error('Export error:', err);
      setError(err.message || 'Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  // Calculate transaction counts
  const purchaseCount = purchases?.length || 0;
  const salesCount = sales?.length || 0;
  const consumptionCount = consumption?.length || 0;
  const totalTransactions = purchaseCount + salesCount + consumptionCount;

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Export Inventory Transactions
        </Typography>

        {anyError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            Error loading transaction data: {(anyError as Error).message}
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {exported && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Inventory transactions exported successfully!
          </Alert>
        )}

        {isLoading ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <CircularProgress size={24} />
            <Typography>Loading inventory data...</Typography>
          </Box>
        ) : (
          <Box sx={{ mb: 3 }}>
            <Typography variant="body1" paragraph>
              The export will include:
            </Typography>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Chip 
                icon={<InfoIcon />} 
                label={`${purchaseCount} Purchases`} 
                variant="outlined" 
                color="primary"
              />
              <Chip 
                icon={<InfoIcon />} 
                label={`${salesCount} Sales`} 
                variant="outlined" 
                color="success"
              />
              <Chip 
                icon={<InfoIcon />} 
                label={`${consumptionCount} Consumption Records`} 
                variant="outlined" 
                color="warning"
              />
            </Box>
          </Box>
        )}
        
        <Divider sx={{ my: 2 }} />
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Button
            variant="contained"
            startIcon={isLoading || exporting ? <CircularProgress size={20} color="inherit" /> : <FileDownloadIcon />}
            onClick={handleExport}
            disabled={isLoading || exporting || totalTransactions === 0}
            sx={{ mr: 2 }}
          >
            {isLoading ? 'Loading Data...' : exporting ? 'Exporting...' : 'Export to Excel'}
          </Button>
          
          <Typography variant="body2" color="text.secondary">
            {totalTransactions > 0 
              ? `Total ${totalTransactions} transactions will be exported` 
              : 'No transactions available to export'}
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default InventoryExport; 