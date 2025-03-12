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
import { supabase } from '../../lib/supabaseClient';

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
  purchase_invoice_number: string;
  purchase_quantity: number;
  mrp_including_gst: number;
  mrp_excluding_gst: number;
  discount_percentage: number;
  purchase_cost_per_unit: number;
  gst_percentage: number;
  purchase_taxable_value: number;
  purchases_cgst: number;
  purchases_sgst: number;
  purchase_invoice_value: number;
  created_at: string;
  product?: Product;
}

interface Sale {
  id: string;
  product_id: string;
  invoice_number: string;
  quantity: number;
  mrp_including_gst: number;
  mrp_excluding_gst: number;
  discount_percentage: number;
  cost_per_unit: number;
  gst_percentage: number;
  taxable_value: number;
  cgst: number;
  sgst: number;
  invoice_value: number;
  created_at: string;
  product?: Product;
}

interface SalonUsage {
  id: string;
  product_id: string;
  reference_number: string;
  quantity: number;
  mrp_including_gst: number;
  mrp_excluding_gst: number;
  discount_percentage: number;
  cost_per_unit: number;
  gst_percentage: number;
  taxable_value: number;
  cgst: number;
  sgst: number;
  total_value: number;
  created_at: string;
  product?: Product;
}

// Combined transaction type for export
interface InventoryTransaction {
  'Transaction Type': string;
  'Product Name': string;
  'HSN Code': string;
  'UNITS': string;
  'Purchase Invoice Number': string;
  'Purchase Qty': number;
  'MRP Including GST': number;
  'MRP Excluding GST': number;
  'Discount on Purchase Percentage': number;
  'Purchase Cost per Unit': number;
  'GST Percentage': number;
  'Purchase Taxable Value': number;
  'Purchases CGST': number;
  'Purchases SGST': number;
  'Purchase Invoice Value': number;
}

const InventoryExport: React.FC = () => {
  const [exportLoading, setExportLoading] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState(false);

  // Fetch purchases data
  const { 
    data: purchasesData, 
    isLoading: purchasesLoading, 
    error: purchasesError 
  } = useQuery({
    queryKey: ['purchases-export'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchases')
        .select(`
          *,
          product:product_id (
            id,
            name,
            hsn_code,
            unit
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Purchase[];
    }
  });

  // Fetch sales data
  const { 
    data: salesData, 
    isLoading: salesLoading, 
    error: salesError 
  } = useQuery({
    queryKey: ['sales-export'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          product:product_id (
            id,
            name,
            hsn_code,
            unit
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Sale[];
    }
  });

  // Fetch salon usage data
  const { 
    data: salonUsageData, 
    isLoading: salonUsageLoading, 
    error: salonUsageError 
  } = useQuery({
    queryKey: ['salon-usage-export'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('salon_usage')
        .select(`
          *,
          product:product_id (
            id,
            name,
            hsn_code,
            unit
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as SalonUsage[];
    }
  });

  // Check if any data is loading
  const isLoading = purchasesLoading || salesLoading || salonUsageLoading;

  // Check for errors
  const error = purchasesError || salesError || salonUsageError;

  // Transform purchases data to the common format
  const transformPurchases = (purchases: Purchase[]): InventoryTransaction[] => {
    return purchases.map(purchase => ({
      'Transaction Type': 'Purchase',
      'Product Name': purchase.product?.name || 'Unknown',
      'HSN Code': purchase.product?.hsn_code || '',
      'UNITS': purchase.product?.unit || '',
      'Purchase Invoice Number': purchase.purchase_invoice_number,
      'Purchase Qty': purchase.purchase_quantity,
      'MRP Including GST': purchase.mrp_including_gst,
      'MRP Excluding GST': purchase.mrp_excluding_gst,
      'Discount on Purchase Percentage': purchase.discount_percentage,
      'Purchase Cost per Unit': purchase.purchase_cost_per_unit,
      'GST Percentage': purchase.gst_percentage,
      'Purchase Taxable Value': purchase.purchase_taxable_value,
      'Purchases CGST': purchase.purchases_cgst,
      'Purchases SGST': purchase.purchases_sgst,
      'Purchase Invoice Value': purchase.purchase_invoice_value
    }));
  };

  // Transform sales data to the common format
  const transformSales = (sales: Sale[]): InventoryTransaction[] => {
    return sales.map(sale => ({
      'Transaction Type': 'Sale',
      'Product Name': sale.product?.name || 'Unknown',
      'HSN Code': sale.product?.hsn_code || '',
      'UNITS': sale.product?.unit || '',
      'Purchase Invoice Number': sale.invoice_number,
      'Purchase Qty': sale.quantity,
      'MRP Including GST': sale.mrp_including_gst,
      'MRP Excluding GST': sale.mrp_excluding_gst,
      'Discount on Purchase Percentage': sale.discount_percentage,
      'Purchase Cost per Unit': sale.cost_per_unit,
      'GST Percentage': sale.gst_percentage,
      'Purchase Taxable Value': sale.taxable_value,
      'Purchases CGST': sale.cgst,
      'Purchases SGST': sale.sgst,
      'Purchase Invoice Value': sale.invoice_value
    }));
  };

  // Transform salon usage data to the common format
  const transformSalonUsage = (usages: SalonUsage[]): InventoryTransaction[] => {
    return usages.map(usage => ({
      'Transaction Type': 'Consumption',
      'Product Name': usage.product?.name || 'Unknown',
      'HSN Code': usage.product?.hsn_code || '',
      'UNITS': usage.product?.unit || '',
      'Purchase Invoice Number': usage.reference_number,
      'Purchase Qty': usage.quantity,
      'MRP Including GST': usage.mrp_including_gst,
      'MRP Excluding GST': usage.mrp_excluding_gst,
      'Discount on Purchase Percentage': usage.discount_percentage,
      'Purchase Cost per Unit': usage.cost_per_unit,
      'GST Percentage': usage.gst_percentage,
      'Purchase Taxable Value': usage.taxable_value,
      'Purchases CGST': usage.cgst,
      'Purchases SGST': usage.sgst,
      'Purchase Invoice Value': usage.total_value
    }));
  };

  // Handle export
  const handleExport = () => {
    try {
      setExportLoading(true);
      setExportError(null);
      setExportSuccess(false);

      // Combine all transactions
      const allTransactions: InventoryTransaction[] = [
        ...(purchasesData ? transformPurchases(purchasesData) : []),
        ...(salesData ? transformSales(salesData) : []),
        ...(salonUsageData ? transformSalonUsage(salonUsageData) : [])
      ];

      // Create workbook
      const wb = XLSX.utils.book_new();

      // Create worksheet from transactions
      const ws = XLSX.utils.json_to_sheet(allTransactions, {
        header: [
          'Transaction Type',
          'Product Name',
          'HSN Code',
          'UNITS',
          'Purchase Invoice Number',
          'Purchase Qty',
          'MRP Including GST',
          'MRP Excluding GST',
          'Discount on Purchase Percentage',
          'Purchase Cost per Unit',
          'GST Percentage',
          'Purchase Taxable Value',
          'Purchases CGST',
          'Purchases SGST',
          'Purchase Invoice Value'
        ]
      });

      // Set column widths
      const wscols = [
        { wch: 15 }, // Transaction Type
        { wch: 30 }, // Product Name
        { wch: 12 }, // HSN Code
        { wch: 10 }, // UNITS
        { wch: 25 }, // Purchase Invoice Number
        { wch: 15 }, // Purchase Qty
        { wch: 18 }, // MRP Including GST
        { wch: 18 }, // MRP Excluding GST
        { wch: 30 }, // Discount on Purchase Percentage
        { wch: 22 }, // Purchase Cost per Unit
        { wch: 15 }, // GST Percentage
        { wch: 22 }, // Purchase Taxable Value
        { wch: 15 }, // Purchases CGST
        { wch: 15 }, // Purchases SGST
        { wch: 22 }  // Purchase Invoice Value
      ];
      ws['!cols'] = wscols;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Inventory Transactions');

      // Generate Excel file
      const currentDate = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `Salon_Inventory_Transactions_${currentDate}.xlsx`);

      setExportSuccess(true);
    } catch (err: any) {
      console.error('Export error:', err);
      setExportError(err.message || 'Failed to export data');
    } finally {
      setExportLoading(false);
    }
  };

  // Calculate transaction counts
  const purchaseCount = purchasesData?.length || 0;
  const salesCount = salesData?.length || 0;
  const consumptionCount = salonUsageData?.length || 0;
  const totalTransactions = purchaseCount + salesCount + consumptionCount;

  return (
    <Paper sx={{ p: 3, mb: 4 }}>
      <Typography variant="h5" gutterBottom>
        Export Inventory Transactions
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Export all inventory transactions (purchases, sales, and salon consumption) to a single Excel file.
        The export includes all transaction details with standardized column headers.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Error loading transaction data: {(error as Error).message}
        </Alert>
      )}

      {exportError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {exportError}
        </Alert>
      )}

      {exportSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Inventory transactions exported successfully!
        </Alert>
      )}

      <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="subtitle1">
          Transaction Summary
        </Typography>
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <Chip 
            label={`Purchases: ${purchaseCount}`} 
            color="primary" 
            variant="outlined" 
          />
          <Chip 
            label={`Sales: ${salesCount}`} 
            color="secondary" 
            variant="outlined" 
          />
          <Chip 
            label={`Consumption: ${consumptionCount}`} 
            color="info" 
            variant="outlined" 
          />
          <Chip 
            label={`Total: ${totalTransactions}`} 
            color="default" 
            variant="outlined" 
            icon={<InfoIcon />}
          />
        </Box>
      </Box>

      <Divider sx={{ mb: 3 }} />

      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Button
          variant="contained"
          startIcon={isLoading || exportLoading ? <CircularProgress size={20} color="inherit" /> : <FileDownloadIcon />}
          onClick={handleExport}
          disabled={isLoading || exportLoading || totalTransactions === 0}
          sx={{ mr: 2 }}
        >
          {isLoading ? 'Loading Data...' : exportLoading ? 'Exporting...' : 'Export to Excel'}
        </Button>
        
        {isLoading && (
          <Typography variant="body2" color="text.secondary">
            Loading transaction data...
          </Typography>
        )}
      </Box>
    </Paper>
  );
};

export default InventoryExport; 