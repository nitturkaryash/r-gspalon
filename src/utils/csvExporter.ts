import { Purchase, Sale, Consumption, BalanceStock, InventoryExportData } from '../models/inventoryTypes';

// Define column headers for the CSV file
const CSV_HEADERS = [
  // Purchases columns
  'Date', 'Product Name', 'HSN Code', 'Units', 'Purchase Invoice Number', 'Purchase Qty',
  'MRP Incl. GST', 'MRP Excl. GST', 'Discount on Purchase Percentage', 'GST Percentage',
  'Purchase Taxable Value', 'Purchase IGST', 'Purchase CGST', 'Purchase SGST', 'Purchase Invoice Value Rs',
  
  // Sales columns
  'Invoice No', 'Sales Qty', 'Purchase Cost Per Unit Ex GST', 'Purchase GST Percentage',
  'Purchase Taxable Value', 'Purchase IGST', 'Purchase CGST', 'Purchase SGST', 'Total Purchase Cost',
  'MRP Incl. GST', 'MRP Excl. GST', 'Discount on Sales Percentage', 'Discounted Sales Rate Excl. GST',
  'Sales GST Percentage', 'Sales Taxable Value', 'IGST Rs', 'CGST Rs', 'SGST Rs', 'Invoice Value Rs',
  
  // Consumption columns
  'Requisition Voucher No', 'Consumption Qty', 'Purchase Cost Per Unit Ex GST', 'Purchase GST Percentage',
  'Purchase Taxable Value', 'Purchase IGST', 'Purchase CGST', 'Purchase SGST', 'Total Purchase Cost',
  'Balance Qty', 'Taxable Value', 'IGST Rs', 'CGST Rs', 'SGST Rs', 'Invoice Value'
];

// Helper functions for CSV formatting
const formatDate = (date: string | undefined): string => {
  if (!date) return '';
  try {
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch (error) {
    return date;
  }
};

const formatNumber = (value: number | undefined | null): string => {
  if (value === undefined || value === null) return '';
  return value.toString();
};

// Generate comprehensive CSV data for inventory
export const generateCsvData = (data: InventoryExportData): string => {
  const { purchases, sales, consumption, balanceStock } = data;
  
  // Create header rows with all columns
  let csvContent = 'Date,Product Name,HSN Code,Units,Transaction Type,Quantity,';
  csvContent += 'Purchase Invoice No,Purchase Price Incl GST,Purchase Price Excl GST,Discount %,';
  csvContent += 'Purchase Cost Per Unit Excl GST,Purchase GST %,Purchase Taxable Value,';
  csvContent += 'Purchase CGST,Purchase SGST,';
  csvContent += 'Sales Invoice No,MRP Incl GST,MRP Excl GST,Sales Discount %,Discounted Sales Rate,';
  csvContent += 'Sales GST %,Sales Taxable Value,Sales IGST,Sales CGST,Sales SGST,Sales Invoice Value,';
  csvContent += 'Requisition Voucher No,Consumption Qty,Consumption Cost Per Unit,Consumption GST %,';
  csvContent += 'Consumption Taxable Value,Consumption CGST,Consumption SGST,Consumption Total Value,';
  csvContent += 'Balance Qty,Taxable Value,CGST,SGST,Invoice Value\n';
  
  // Process purchases
  purchases.forEach(purchase => {
    const row: string[] = [];
    
    // Common product details
    row.push(`"${formatDate(purchase.date)}"`);
    row.push(`"${purchase.product_name || ''}"`);
    row.push(`"${purchase.hsn_code || ''}"`);
    row.push(`"${purchase.units || ''}"`);
    row.push('"PURCHASE"'); // Transaction type
    row.push(formatNumber(purchase.purchase_qty));
    
    // Purchase specific columns
    row.push(`"${purchase.invoice_no || ''}"`);
    row.push(formatNumber(purchase.mrp_incl_gst));
    row.push(formatNumber(purchase.mrp_excl_gst));
    row.push(formatNumber(purchase.discount_on_purchase_percentage));
    row.push(formatNumber(
      (purchase.purchase_taxable_value && purchase.purchase_qty && purchase.purchase_qty > 0)
        ? purchase.purchase_taxable_value / purchase.purchase_qty
        : 0
    )); // Cost per unit
    row.push(formatNumber(purchase.gst_percentage));
    row.push(formatNumber(purchase.purchase_taxable_value));
    row.push(formatNumber(purchase.purchase_cgst));
    row.push(formatNumber(purchase.purchase_sgst));
    
    // Empty cells for sales columns
    for (let i = 0; i < 11; i++) {
      row.push('');
    }
    
    // Empty cells for consumption columns
    for (let i = 0; i < 13; i++) {
      row.push('');
    }
    
    csvContent += row.join(',') + '\n';
  });
  
  // Process sales
  sales.forEach(sale => {
    const row: string[] = [];
    
    // Common product details
    row.push(`"${formatDate(sale.date)}"`);
    row.push(`"${sale.product_name || ''}"`);
    row.push(`"${sale.hsn_code || ''}"`);
    row.push(`"${sale.unit || ''}"`);
    row.push('"SALE"'); // Transaction type
    row.push(formatNumber(sale.qty || sale.quantity));
    
    // Empty cells for purchase columns
    for (let i = 0; i < 9; i++) {
      row.push('');
    }
    
    // Sales specific columns
    row.push(`"${sale.invoice_no || ''}"`);
    row.push(formatNumber(sale.mrp_incl_gst));
    row.push(formatNumber(sale.mrp_excl_gst));
    row.push(formatNumber(sale.discount_percentage));
    row.push(formatNumber(sale.discounted_sales_rate_ex_gst));
    row.push(formatNumber(sale.gst_percentage));
    row.push(formatNumber(sale.taxable_value));
    row.push(formatNumber(sale.igst));
    row.push(formatNumber(sale.cgst));
    row.push(formatNumber(sale.sgst));
    row.push(formatNumber(sale.invoice_value));
    
    // Empty cells for consumption columns
    for (let i = 0; i < 13; i++) {
      row.push('');
    }
    
    csvContent += row.join(',') + '\n';
  });
  
  // Process consumption
  consumption.forEach(item => {
    const row: string[] = [];
    
    // Common product details
    row.push(`"${formatDate(item.date)}"`);
    row.push(`"${item.product_name || ''}"`);
    row.push(`"${item.hsn_code || ''}"`);
    row.push(`"${item.units || ''}"`);
    row.push('"CONSUMPTION"'); // Transaction type
    row.push(formatNumber(item.qty || item.quantity));
    
    // Empty cells for purchase columns
    for (let i = 0; i < 9; i++) {
      row.push('');
    }
    
    // Empty cells for sales columns
    for (let i = 0; i < 11; i++) {
      row.push('');
    }
    
    // Consumption specific columns
    row.push(`"${item.requisition_voucher_no || ''}"`);
    row.push(formatNumber(item.consumption_qty || item.quantity));
    row.push(formatNumber(item.purchase_cost_per_unit_ex_gst));
    row.push(formatNumber(item.purchase_gst_percentage));
    row.push(formatNumber(item.purchase_taxable_value));
    row.push(formatNumber(item.purchase_cgst));
    row.push(formatNumber(item.purchase_sgst));
    row.push(formatNumber(item.invoice_value));
    row.push(formatNumber(item.balance_qty));
    row.push(formatNumber(item.taxable_value));
    row.push(formatNumber(item.cgst));
    row.push(formatNumber(item.sgst));
    row.push(formatNumber(item.invoice_value));
    
    csvContent += row.join(',') + '\n';
  });
  
  // Process balance stock as a summary
  balanceStock.forEach(item => {
    const row: string[] = [];
    
    // Include product details
    row.push(`"${formatDate(new Date().toISOString())}"`); // Current date
    row.push(`"${item.product_name || ''}"`);
    row.push(`"${item.hsn_code || ''}"`);
    row.push(`"${item.unit || ''}"`);
    row.push('"BALANCE STOCK"'); // Indicate this is a balance row
    row.push(formatNumber(item.balance_qty));
    
    // Fill other columns with empty values
    for (let i = 0; i < 33; i++) {
      row.push('');
    }
    
    csvContent += row.join(',') + '\n';
  });
  
  return csvContent;
};

/**
 * Convert an array of objects to CSV string
 * @param data Array of objects to convert to CSV
 * @param headers Optional headers for the CSV
 * @returns CSV string
 */
export function objectsToCSV(data: Record<string, any>[], headers?: string[]): string {
  if (!data || data.length === 0) return '';
  
  // Determine headers from the first object if not provided
  const csvHeaders = headers || Object.keys(data[0]);
  
  // Create header row
  const headerRow = csvHeaders.join(',');
  
  // Create data rows
  const dataRows = data.map(item => {
    return csvHeaders.map(header => {
      const value = item[header];
      // Handle different data types appropriately
      if (value === null || value === undefined) return '';
      if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`;
      return value;
    }).join(',');
  });
  
  // Combine header and data rows
  return [headerRow, ...dataRows].join('\n');
}

/**
 * Download data as a CSV file
 * @param data Array of objects or InventoryExportData to convert to CSV
 * @param filename Name of the file to download (optional if data is InventoryExportData)
 * @param headers Optional headers for the CSV
 */
export function downloadCsv(
  data: Record<string, any>[] | InventoryExportData, 
  filename?: string, 
  headers?: string[]
): void {
  // Handle InventoryExportData object
  if (!Array.isArray(data) && typeof data === 'object' && 'purchases' in data) {
    // Generate CSV content from inventory data
    const csvContent = generateCsvData(data);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    // Set filename
    const exportFilename = filename || `inventory_export_${new Date().toISOString().split('T')[0]}.csv`;
    
    // Set link properties
    link.setAttribute('href', url);
    link.setAttribute('download', exportFilename);
    link.style.visibility = 'hidden';
    
    // Append to document, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    return;
  }
  
  // Handle regular array of records
  if (Array.isArray(data)) {
    if (!filename) {
      console.error('Filename is required when providing array data');
      return;
    }
    
    // Convert data to CSV
    const csvContent = objectsToCSV(data, headers);
    
    // Create a Blob with the CSV content
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Create a download link
    const link = document.createElement('a');
    
    // Support for browsers with download attribute
    if (typeof window !== 'undefined' && window.navigator && 'msSaveBlob' in window.navigator) {
      // IE/Edge support
      (window.navigator as any).msSaveBlob(blob, filename);
    } else {
      // Other browsers
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);
    }
  }
}

/**
 * Format data for CSV export, handling complex data types
 * @param data Any data that needs formatting for CSV export
 * @returns Formatted data
 */
export function formatForCSV(data: any): string {
  if (data === null || data === undefined) return '';
  
  if (typeof data === 'object' && !(data instanceof Date)) {
    return JSON.stringify(data).replace(/"/g, '""');
  }
  
  if (data instanceof Date) {
    return data.toISOString();
  }
  
  return String(data);
} 