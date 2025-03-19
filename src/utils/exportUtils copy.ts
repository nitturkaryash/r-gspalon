import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { formatCurrency } from './format';

// Type for the jspdf-autotable plugin
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

/**
 * Convert data to CSV format and trigger download
 * @param data - Array of objects to convert to CSV
 * @param fileName - Name of the CSV file (without extension)
 * @param headers - Object mapping data keys to header labels
 */
export const exportToCSV = <T extends Record<string, any>>(
  data: T[],
  fileName: string,
  headers: Record<keyof T, string>
): void => {
  if (!data || data.length === 0) {
    console.error('No data to export');
    return;
  }

  // Create header row
  const headerRow = Object.values(headers).join(',');
  
  // Create data rows
  const rows = data.map(item => {
    return Object.keys(headers)
      .map(key => {
        const value = item[key];
        // Handle special formatting
        if (typeof value === 'number') {
          return value.toString();
        }
        if (value === null || value === undefined) {
          return '';
        }
        // Wrap strings with commas in quotes
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value}"`;
        }
        return value.toString();
      })
      .join(',');
  });

  // Combine header and rows
  const csv = [headerRow, ...rows].join('\n');
  
  // Create download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  // Create a hidden link and trigger download
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${fileName}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Convert data to PDF format and trigger download
 * @param data - Array of objects to convert to PDF
 * @param fileName - Name of the PDF file (without extension)
 * @param headers - Object mapping data keys to header labels
 * @param title - Title for the PDF document
 */
export const exportToPDF = <T extends Record<string, any>>(
  data: T[],
  fileName: string,
  headers: Record<keyof T, string>,
  title: string
): void => {
  if (!data || data.length === 0) {
    console.error('No data to export');
    return;
  }

  // Create new PDF document
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Add title
  doc.setFontSize(16);
  doc.text(title, doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' });
  doc.setFontSize(10);
  
  // Add date and time
  const now = new Date();
  doc.text(
    `Generated on: ${now.toLocaleDateString()} at ${now.toLocaleTimeString()}`,
    doc.internal.pageSize.getWidth() - 15, 
    10, 
    { align: 'right' }
  );

  // Prepare header and data for table
  const tableHeaders = Object.values(headers);
  const tableData = data.map(item => {
    return Object.keys(headers).map(key => {
      const value = item[key];
      
      // Format based on data type
      if (typeof value === 'number') {
        // Check if it might be a currency value by key name
        if (key.includes('price') || key.includes('total') || key.includes('tax') || 
            key.includes('subtotal') || key.includes('discount') || key.includes('cost')) {
          return formatCurrency(value);
        }
        return value.toString();
      }
      
      if (value === null || value === undefined) {
        return '';
      }
      
      if (typeof value === 'object' && value instanceof Date) {
        return value.toLocaleDateString();
      }
      
      return value.toString();
    });
  });

  // Create the table
  doc.autoTable({
    head: [tableHeaders],
    body: tableData,
    startY: 25,
    headStyles: {
      fillColor: [107, 142, 35], // Olive green to match theme
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    styles: {
      lineColor: [200, 200, 200],
      lineWidth: 0.1
    },
    alternateRowStyles: {
      fillColor: [247, 247, 247]
    },
    margin: { top: 25 }
  });

  // Save PDF
  doc.save(`${fileName}.pdf`);
};

/**
 * Helper function to format order data specifically for export
 * @param orders - Array of order objects
 * @returns Formatted array for export
 */
export const formatOrdersForExport = (orders: any[]): any[] => {
  return orders.map(order => ({
    id: order.id,
    created_at: new Date(order.created_at).toLocaleString(),
    client_name: order.client_name,
    stylist_name: order.stylist_name,
    subtotal: order.subtotal,
    tax: order.tax,
    discount: order.discount,
    total: order.total,
    payment_method: order.payment_method.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
    status: order.status,
    is_walk_in: order.is_walk_in ? 'Walk-in' : 'Appointment',
    services: order.services.map((s: any) => s.service_name).join(', ')
  }));
};

/**
 * Order export header definitions
 */
export const orderExportHeaders = {
  id: 'Order ID',
  created_at: 'Date & Time',
  client_name: 'Customer',
  stylist_name: 'Stylist',
  subtotal: 'Subtotal (₹)',
  tax: 'GST (₹)',
  discount: 'Discount (₹)',
  total: 'Total (₹)',
  payment_method: 'Payment Method',
  status: 'Status',
  is_walk_in: 'Type',
  services: 'Services'
}; 