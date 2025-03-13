import { supabase } from './_supabase.js';
import multer from 'multer';
import xlsx from 'xlsx';
import { v4 as uuidv4 } from 'uuid';

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Helper function to standardize unit codes
const standardizeUnit = (unitStr) => {
  if (!unitStr) return '';
  
  const unitMappings = {
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
const fixFloatingPointErrors = (value) => {
  if (typeof value !== 'number') return value;
  if (Math.abs(value) < 1e-10) return 0;
  return Number(value.toFixed(2));
};

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Use multer to handle file upload
    upload.single('file')(req, res, async function(err) {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      
      // Check file type
      if (!req.file.originalname.endsWith('.xlsx') && !req.file.originalname.endsWith('.xls')) {
        return res.status(400).json({ error: 'File must be an Excel file (.xlsx or .xls)' });
      }
      
      try {
        // Read the Excel file
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        
        // Check if the workbook has the expected sheet
        if (!workbook.SheetNames.includes('STOCK DETAILS')) {
          return res.status(400).json({ error: 'Excel file must contain a sheet named "STOCK DETAILS"' });
        }
        
        const worksheet = workbook.Sheets['STOCK DETAILS'];
        const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (!jsonData || jsonData.length === 0) {
          return res.status(400).json({ error: 'No data found in the STOCK DETAILS sheet' });
        }
        
        // Find section headers in the data
        let purchaseHeaderRow = -1;
        let salesHeaderRow = -1;
        let consumptionHeaderRow = -1;
        let balanceHeaderRow = -1;
        
        for (let i = 0; i < jsonData.length; i++) {
          const row = jsonData[i];
          const rowStr = row.join(' ');
          
          if (rowStr.includes('PURCHASE - STOCK IN')) {
            purchaseHeaderRow = i;
          } else if (rowStr.includes('SALES TO CUSTOMER - STOCK OUT')) {
            salesHeaderRow = i;
          } else if (rowStr.includes('SALON CONSUMPTION - STOCK OUT')) {
            consumptionHeaderRow = i;
          } else if (rowStr.includes('BALANCE STOCK')) {
            balanceHeaderRow = i;
          }
        }
        
        if (purchaseHeaderRow === -1 || salesHeaderRow === -1 || consumptionHeaderRow === -1) {
          return res.status(400).json({ error: 'Invalid Excel format: Missing required sections' });
        }
        
        // Process Purchase section
        const purchaseColsRow = purchaseHeaderRow + 1;
        const purchaseDataStart = purchaseHeaderRow + 2;
        const purchaseDataEnd = salesHeaderRow - 1;
        
        const purchaseHeaders = jsonData[purchaseColsRow];
        const purchaseData = [];
        
        for (let i = purchaseDataStart; i <= purchaseDataEnd; i++) {
          const row = jsonData[i];
          if (!row || !row[1]) continue; // Skip rows without product name
          
          purchaseData.push({
            date: row[0] || '',
            product_name: row[1] || '',
            hsn_code: row[2] || '',
            units: standardizeUnit(row[3] || ''),
            invoice_no: row[4] || '',
            qty: fixFloatingPointErrors(row[5]) || 0,
            price_incl_gst: fixFloatingPointErrors(row[6]) || 0,
            price_ex_gst: fixFloatingPointErrors(row[7]) || 0,
            discount_percentage: fixFloatingPointErrors(row[8]) || 0,
            purchase_cost_per_unit_ex_gst: fixFloatingPointErrors(row[9]) || 0,
            gst_percentage: fixFloatingPointErrors(row[10]) || 0,
            taxable_value: fixFloatingPointErrors(row[11]) || 0,
            igst: fixFloatingPointErrors(row[12]) || 0,
            cgst: fixFloatingPointErrors(row[13]) || 0,
            sgst: fixFloatingPointErrors(row[14]) || 0,
            invoice_value: fixFloatingPointErrors(row[15]) || 0
          });
        }
        
        // Process Sales section
        const salesColsRow = salesHeaderRow + 1;
        const salesDataStart = salesHeaderRow + 2;
        const salesDataEnd = consumptionHeaderRow - 1;
        
        const salesHeaders = jsonData[salesColsRow];
        const salesData = [];
        
        for (let i = salesDataStart; i <= salesDataEnd; i++) {
          const row = jsonData[i];
          if (!row || !row[1]) continue; // Skip rows without product name
          
          salesData.push({
            date: row[0] || '',
            product_name: row[1] || '',
            hsn_code: row[2] || '',
            units: standardizeUnit(row[3] || ''),
            invoice_no: row[4] || '',
            qty: fixFloatingPointErrors(row[5]) || 0,
            purchase_cost_per_unit_ex_gst: fixFloatingPointErrors(row[6]) || 0,
            purchase_gst_percentage: fixFloatingPointErrors(row[7]) || 0,
            purchase_taxable_value: fixFloatingPointErrors(row[8]) || 0,
            purchase_igst: fixFloatingPointErrors(row[9]) || 0,
            purchase_cgst: fixFloatingPointErrors(row[10]) || 0,
            purchase_sgst: fixFloatingPointErrors(row[11]) || 0,
            total_purchase_cost: fixFloatingPointErrors(row[12]) || 0,
            mrp_incl_gst: fixFloatingPointErrors(row[13]) || 0,
            mrp_ex_gst: fixFloatingPointErrors(row[14]) || 0,
            discount_percentage: fixFloatingPointErrors(row[15]) || 0,
            discounted_sales_rate_ex_gst: fixFloatingPointErrors(row[16]) || 0,
            sales_gst_percentage: fixFloatingPointErrors(row[17]) || 0,
            sales_taxable_value: fixFloatingPointErrors(row[18]) || 0,
            sales_igst: fixFloatingPointErrors(row[19]) || 0,
            sales_cgst: fixFloatingPointErrors(row[20]) || 0,
            sales_sgst: fixFloatingPointErrors(row[21]) || 0,
            invoice_value: fixFloatingPointErrors(row[22]) || 0
          });
        }
        
        // Process Consumption section
        const consumptionColsRow = consumptionHeaderRow + 1;
        const consumptionDataStart = consumptionHeaderRow + 2;
        const consumptionDataEnd = balanceHeaderRow !== -1 ? balanceHeaderRow - 1 : jsonData.length - 1;
        
        const consumptionHeaders = jsonData[consumptionColsRow];
        const consumptionData = [];
        
        for (let i = consumptionDataStart; i <= consumptionDataEnd; i++) {
          const row = jsonData[i];
          if (!row || !row[1]) continue; // Skip rows without product name
          
          consumptionData.push({
            date: row[0] || '',
            product_name: row[1] || '',
            hsn_code: row[2] || '',
            units: standardizeUnit(row[3] || ''),
            requisition_voucher_no: row[4] || '',
            qty: fixFloatingPointErrors(row[5]) || 0,
            purchase_cost_per_unit_ex_gst: fixFloatingPointErrors(row[6]) || 0,
            purchase_gst_percentage: fixFloatingPointErrors(row[7]) || 0,
            taxable_value: fixFloatingPointErrors(row[8]) || 0,
            igst: fixFloatingPointErrors(row[9]) || 0,
            cgst: fixFloatingPointErrors(row[10]) || 0,
            sgst: fixFloatingPointErrors(row[11]) || 0,
            total_purchase_cost: fixFloatingPointErrors(row[12]) || 0
          });
        }
        
        // Process Balance Stock if available
        let balanceData = [];
        if (balanceHeaderRow !== -1) {
          const balanceColsRow = balanceHeaderRow + 1;
          const balanceDataStart = balanceHeaderRow + 2;
          
          for (let i = balanceDataStart; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (!row || !row[0]) continue; // Skip rows without product name
            
            balanceData.push({
              product_name: row[0] || '',
              hsn_code: row[1] || '',
              units: standardizeUnit(row[2] || ''),
              qty: fixFloatingPointErrors(row[3]) || 0,
              taxable_value: fixFloatingPointErrors(row[4]) || 0,
              igst: fixFloatingPointErrors(row[5]) || 0,
              cgst: fixFloatingPointErrors(row[6]) || 0,
              sgst: fixFloatingPointErrors(row[7]) || 0,
              invoice_value: fixFloatingPointErrors(row[8]) || 0
            });
          }
        }
        
        // Extract unique products
        const uniqueProducts = new Map();
        
        // Add products from purchases
        for (const purchase of purchaseData) {
          const key = `${purchase.product_name}|${purchase.hsn_code}`;
          if (!uniqueProducts.has(key)) {
            uniqueProducts.set(key, {
              product_name: purchase.product_name,
              hsn_code: purchase.hsn_code,
              units: purchase.units
            });
          }
        }
        
        // Add products from sales
        for (const sale of salesData) {
          const key = `${sale.product_name}|${sale.hsn_code}`;
          if (!uniqueProducts.has(key)) {
            uniqueProducts.set(key, {
              product_name: sale.product_name,
              hsn_code: sale.hsn_code,
              units: sale.units
            });
          }
        }
        
        // Add products from consumption
        for (const consumption of consumptionData) {
          const key = `${consumption.product_name}|${consumption.hsn_code}`;
          if (!uniqueProducts.has(key)) {
            uniqueProducts.set(key, {
              product_name: consumption.product_name,
              hsn_code: consumption.hsn_code,
              units: consumption.units
            });
          }
        }
        
        // Convert unique products to array
        const productsList = Array.from(uniqueProducts.values());
        
        // Return the parsed data
        return res.status(200).json({
          purchases: purchaseData,
          sales: salesData,
          consumption: consumptionData,
          balance: balanceData,
          products: productsList
        });
        
      } catch (error) {
        console.error('Error processing Excel file:', error);
        return res.status(500).json({ error: error.message });
      }
    });
  } catch (error) {
    console.error('Error handling request:', error);
    return res.status(500).json({ error: error.message });
  }
} 