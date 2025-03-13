import { supabase } from './_supabase.js';
import ExcelJS from 'exceljs';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Fetch all data from Supabase
    const [
      productsResponse,
      purchasesResponse,
      salesResponse,
      consumptionResponse,
      balanceResponse
    ] = await Promise.all([
      supabase.from('products').select('*'),
      supabase.from('purchases').select('*, products(*)'),
      supabase.from('sales').select('*, products(*)'),
      supabase.from('consumption').select('*, products(*)'),
      supabase.from('balance_stock').select('*, products(*)')
    ]);

    // Check for errors
    if (productsResponse.error) throw productsResponse.error;
    if (purchasesResponse.error) throw purchasesResponse.error;
    if (salesResponse.error) throw salesResponse.error;
    if (consumptionResponse.error) throw consumptionResponse.error;
    if (balanceResponse.error) throw balanceResponse.error;

    // Get the data
    const products = productsResponse.data || [];
    const purchases = purchasesResponse.data || [];
    const sales = salesResponse.data || [];
    const consumption = consumptionResponse.data || [];
    const balance = balanceResponse.data || [];

    // Create a new workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'R&G Salon';
    workbook.lastModifiedBy = 'R&G Salon';
    workbook.created = new Date();
    workbook.modified = new Date();

    // Add a worksheet
    const worksheet = workbook.addWorksheet('STOCK DETAILS');

    // Add title
    worksheet.addRow(['STOCK DETAILS']);
    worksheet.addRow([]);

    // Add purchase section
    worksheet.addRow(['PURCHASE - STOCK IN']);
    
    // Add purchase header
    worksheet.addRow([
      'Date', 'Product Name', 'HSN Code', 'UNITS', 'Invoice No.', 'Qty.',
      'Price Incl. GST', 'Price Ex. GST', 'Discount %', 'Purchase Cost Per Unit Ex. GST', 
      'GST %', 'Taxable Value', 'IGST', 'CGST', 'SGST', 'Invoice Value'
    ]);
    
    // Add purchase data
    for (const purchase of purchases) {
      worksheet.addRow([
        purchase.date,
        purchase.products?.name || '',
        purchase.products?.hsn_code || '',
        purchase.products?.unit || '',
        purchase.invoice_no,
        purchase.qty,
        purchase.incl_gst,
        purchase.ex_gst,
        0, // Discount % (not stored in database)
        purchase.ex_gst / purchase.qty, // Purchase Cost Per Unit Ex. GST
        purchase.igst / purchase.taxable_value * 100, // GST %
        purchase.taxable_value,
        purchase.igst,
        purchase.cgst,
        purchase.sgst,
        purchase.invoice_value
      ]);
    }
    
    worksheet.addRow([]);
    
    // Add sales section
    worksheet.addRow(['SALES TO CUSTOMER - STOCK OUT']);
    
    // Add sales header
    worksheet.addRow([
      'Date', 'Product Name', 'HSN Code', 'UNITS', 'Invoice No.', 'Qty.',
      'Purchase Cost Per Unit Ex. GST', 'Purchase GST %', 'Purchase Taxable Value',
      'Purchase IGST', 'Purchase CGST', 'Purchase SGST', 'Total Purchase Cost',
      'MRP Incl. GST', 'MRP Ex. GST', 'Discount %', 'Discounted Sales Rate Ex. GST',
      'Sales GST %', 'Sales Taxable Value', 'Sales IGST', 'Sales CGST', 'Sales SGST',
      'Invoice Value'
    ]);
    
    // Add sales data
    for (const sale of sales) {
      worksheet.addRow([
        sale.date,
        sale.products?.name || '',
        sale.products?.hsn_code || '',
        sale.products?.unit || '',
        sale.invoice_no,
        sale.qty,
        sale.purchase_cost_per_unit_ex_gst,
        sale.purchase_gst_percentage * 100,
        sale.purchase_taxable_value,
        sale.purchase_igst,
        sale.purchase_cgst,
        sale.purchase_sgst,
        sale.total_purchase_cost,
        sale.incl_gst,
        sale.ex_gst,
        sale.discount_percentage,
        sale.discounted_sales_rate_ex_gst,
        sale.sales_gst_percentage * 100,
        sale.taxable_value,
        sale.igst,
        sale.cgst,
        sale.sgst,
        sale.invoice_value
      ]);
    }
    
    worksheet.addRow([]);
    
    // Add consumption section
    worksheet.addRow(['SALON CONSUMPTION - STOCK OUT']);
    
    // Add consumption header
    worksheet.addRow([
      'Date', 'Product Name', 'HSN Code', 'UNITS', 'Requisition Voucher No.', 'Qty.',
      'Purchase Cost Per Unit Ex. GST', 'Purchase GST %', 'Taxable Value',
      'IGST', 'CGST', 'SGST', 'Total Purchase Cost'
    ]);
    
    // Add consumption data
    for (const item of consumption) {
      worksheet.addRow([
        item.date,
        item.products?.name || '',
        item.products?.hsn_code || '',
        item.products?.unit || '',
        item.requisition_voucher_no || '',
        item.qty,
        item.purchase_cost_per_unit_ex_gst,
        item.purchase_gst_percentage * 100,
        item.taxable_value,
        item.igst,
        item.cgst,
        item.sgst,
        item.total_purchase_cost
      ]);
    }
    
    worksheet.addRow([]);
    
    // Add balance section
    worksheet.addRow(['BALANCE STOCK']);
    
    // Add balance header
    worksheet.addRow([
      'Product Name', 'HSN Code', 'UNITS', 'Qty.', 'Taxable Value',
      'IGST', 'CGST', 'SGST', 'Invoice Value'
    ]);
    
    // Add balance data
    for (const item of balance) {
      worksheet.addRow([
        item.products?.name || '',
        item.products?.hsn_code || '',
        item.products?.unit || '',
        item.qty,
        item.taxable_value,
        item.igst,
        item.cgst,
        item.sgst,
        item.invoice_value
      ]);
    }
    
    // Apply some styling
    worksheet.getRow(1).font = { bold: true, size: 16 };
    worksheet.getRow(3).font = { bold: true, size: 14 };
    worksheet.getRow(4).font = { bold: true };
    worksheet.getRow(purchases.length + 6).font = { bold: true, size: 14 };
    worksheet.getRow(purchases.length + 7).font = { bold: true };
    worksheet.getRow(purchases.length + sales.length + 9).font = { bold: true, size: 14 };
    worksheet.getRow(purchases.length + sales.length + 10).font = { bold: true };
    worksheet.getRow(purchases.length + sales.length + consumption.length + 12).font = { bold: true, size: 14 };
    worksheet.getRow(purchases.length + sales.length + consumption.length + 13).font = { bold: true };
    
    // Generate the Excel file
    const buffer = await workbook.xlsx.writeBuffer();
    
    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=STOCK_DETAILS.xlsx');
    
    // Send the file
    res.status(200).send(Buffer.from(buffer));
  } catch (error) {
    console.error('Error exporting Excel:', error);
    res.status(500).json({ error: error.message });
  }
} 