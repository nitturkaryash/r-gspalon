import * as XLSX from 'xlsx';
import { v4 as uuidv4 } from 'uuid';
import { 
  Purchase, 
  Sale, 
  Consumption, 
  Product,
  BalanceStock 
} from '../models/inventoryTypes';
import { ExcelData as OrderExcelData } from '../models/orderTypes';

// Define our local ExcelData interface to match our specific needs
interface ExcelData {
  products: Product[];
  purchases: Purchase[];
  sales: Sale[];
  consumption: Consumption[];
  balanceStock: BalanceStock[];
}

// Standard column mappings for the STOCK DETAILS Excel file
const COLUMN_MAPPINGS = {
  PRODUCT_NAME: ['Unnamed: 2', 'Product Name', 'Product Name', 'Name', 'Product'],
  HSN_CODE: ['Unnamed: 3', 'HSN Code', 'HSN', 'HSN/SAC'],
  UNITS: ['Unnamed: 4', 'UNITS', 'Unit', 'UOM'],
  
  // Purchase columns
  PURCHASE_INVOICE_NO: ['Purchase Invoice No.', 'Purchase Invoice Number', 'Invoice No.'],
  PURCHASE_DATE: ['Purchase Date', 'Date of Purchase', 'Purchase Date'],
  PURCHASE_QTY: ['Purchase Qty.', 'Purchase Quantity', 'Qty.'],
  PURCHASE_COST_PER_UNIT: ['Purchase Cost per Unit', 'Cost Per Unit', 'Rate'],
  MRP_INCL_GST: ['MRP Incl. GST', 'MRP Including GST', 'MRP (Including GST)'],
  MRP_EXCL_GST: ['MRP Excl. GST', 'MRP Excluding GST', 'MRP (Excluding GST)'],
  DISCOUNT_PERCENTAGE: ['Discount on Purchase %', 'Discount %', 'Discount Percentage'],
  GST_PERCENTAGE: ['GST %', 'GST Percentage', 'GST Rate'],
  PURCHASE_TAXABLE_VALUE: ['Purchase Taxable Value', 'Taxable Amount', 'Taxable Value'],
  PURCHASE_IGST: ['Purchases IGST', 'IGST Amount', 'IGST'],
  PURCHASE_CGST: ['Purchases CGST', 'CGST Amount', 'CGST'],
  PURCHASE_SGST: ['Purchases SGST', 'SGST Amount', 'SGST'],
  PURCHASE_INVOICE_VALUE: ['Purchase Invoice Value', 'Invoice Amount', 'Total Amount'],
  
  // Sales columns
  SALES_INVOICE_NO: ['Sales Invoice No.', 'Sales Invoice Number', 'Invoice No.'],
  SALES_DATE: ['Sales Date', 'Date of Sale', 'Sale Date'],
  SALES_QTY: ['Sales Qty.', 'Sales Quantity', 'Qty.'],
  SALES_RATE: ['Sales Rate', 'Rate', 'Sales Price'],
  SALES_DISCOUNT: ['Sales Discount %', 'Discount %', 'Discount Percentage'],
  SALES_GST: ['Sales GST %', 'GST %', 'GST Percentage'],
  SALES_TAXABLE_VALUE: ['Sales Taxable Value', 'Taxable Amount', 'Taxable Value'],
  SALES_IGST: ['Sales IGST', 'IGST Amount', 'IGST'],
  SALES_CGST: ['Sales CGST', 'CGST Amount', 'CGST'],
  SALES_SGST: ['Sales SGST', 'SGST Amount', 'SGST'],
  SALES_INVOICE_VALUE: ['Sales Invoice Value', 'Invoice Amount', 'Total Amount'],
  
  // Consumption columns
  CONSUMPTION_VOUCHER_NO: ['Requisition Voucher No.', 'Voucher No.', 'Reference No.'],
  CONSUMPTION_DATE: ['Consumption Date', 'Date of Consumption', 'Date'],
  CONSUMPTION_QTY: ['Consumption Qty.', 'Consumption Quantity', 'Qty.'],
  CONSUMPTION_COST: ['Consumption Cost', 'Cost', 'Rate'],
};

// Helper function to find the actual column name in the Excel file
function findColumnName(headers: string[], possibleNames: string[]): string | null {
  for (const name of possibleNames) {
    if (headers.includes(name)) {
      return name;
    }
  }
  return null;
}

// Parse Excel file and extract stock details
export async function parseStockDetailsExcel(file: File): Promise<ExcelData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          throw new Error('Failed to read file');
        }
        
        // Parse the Excel file
        const workbook = XLSX.read(data, { type: 'binary' });
        
        // Check if the sheet exists
        if (!workbook.SheetNames.includes('Sheet1')) {
          throw new Error('Excel file must contain a sheet named "Sheet1"');
        }
        
        // Get the worksheet
        const worksheet = workbook.Sheets['Sheet1'];
        
        // Convert to JSON, skipping header rows
        // We'll parse headers manually to handle multi-header structure
        const rawData = XLSX.utils.sheet_to_json(worksheet, { 
          header: 'A',
          raw: true,
          defval: ''
        }) as Record<string, any>[];
        
        // Extract headers (typically row 2 and 3 combined)
        // This is an approximation - actual implementation may need adjustment based on file structure
        const headers = Array.from(new Set([
          ...Object.values(rawData[1] || {}),
          ...Object.values(rawData[2] || {})
        ])).filter(h => h !== '') as string[];
        
        // Initialize result containers
        const products: Product[] = [];
        const purchases: Purchase[] = [];
        const sales: Sale[] = [];
        const consumption: Consumption[] = [];
        const balanceStock: BalanceStock[] = [];
        
        // Process data rows (typically starting from row 4)
        for (let i = 3; i < rawData.length; i++) {
          const row = rawData[i] as Record<string, any>;
          if (!row) continue;
          
          // Check if this is a data row (has product name)
          const productNameCol = findColumnName(headers, COLUMN_MAPPINGS.PRODUCT_NAME);
          if (!productNameCol || !row[productNameCol]) continue;
          
          // Extract product information
          const productName = row[productNameCol]?.toString() || '';
          const hsnCodeCol = findColumnName(headers, COLUMN_MAPPINGS.HSN_CODE);
          const hsnCode = hsnCodeCol ? row[hsnCodeCol]?.toString() || '' : '';
          const unitsCol = findColumnName(headers, COLUMN_MAPPINGS.UNITS);
          const units = unitsCol ? row[unitsCol]?.toString() || '' : '';
          
          // Find or create product
          let product = products.find(p => 
            p.name === productName && 
            p.hsn_code === hsnCode && 
            p.units === units
          );
          
          if (!product) {
            product = {
              id: uuidv4(),
              name: productName,
              hsn_code: hsnCode,
              units: units,
              created_at: new Date().toISOString()
            };
            products.push(product);
          }
          
          // Process purchase data
          const purchaseInvoiceNoCol = findColumnName(headers, COLUMN_MAPPINGS.PURCHASE_INVOICE_NO);
          if (purchaseInvoiceNoCol && row[purchaseInvoiceNoCol]) {
            const purchase: Purchase = {
              id: uuidv4(),
              product_id: product.id,
              product_name: productName,
              hsn_code: hsnCode,
              date: extractDate(row, headers, COLUMN_MAPPINGS.PURCHASE_DATE),
              invoice_no: row[purchaseInvoiceNoCol]?.toString() || '',
              purchase_qty: extractNumber(row, headers, COLUMN_MAPPINGS.PURCHASE_QTY),
              mrp_incl_gst: extractNumber(row, headers, COLUMN_MAPPINGS.MRP_INCL_GST),
              mrp_excl_gst: extractNumber(row, headers, COLUMN_MAPPINGS.MRP_EXCL_GST),
              discount_on_purchase_percentage: extractNumber(row, headers, COLUMN_MAPPINGS.DISCOUNT_PERCENTAGE),
              purchase_cost_per_unit_ex_gst: extractNumber(row, headers, COLUMN_MAPPINGS.PURCHASE_COST_PER_UNIT),
              gst_percentage: extractNumber(row, headers, COLUMN_MAPPINGS.GST_PERCENTAGE),
              purchase_taxable_value: extractNumber(row, headers, COLUMN_MAPPINGS.PURCHASE_TAXABLE_VALUE),
              igst: extractNumber(row, headers, COLUMN_MAPPINGS.PURCHASE_IGST),
              cgst: extractNumber(row, headers, COLUMN_MAPPINGS.PURCHASE_CGST),
              sgst: extractNumber(row, headers, COLUMN_MAPPINGS.PURCHASE_SGST),
              invoice_value: extractNumber(row, headers, COLUMN_MAPPINGS.PURCHASE_INVOICE_VALUE),
              created_at: new Date().toISOString(),
              units: units,
              qty: extractNumber(row, headers, COLUMN_MAPPINGS.PURCHASE_QTY)
            };
            purchases.push(purchase);
          }
          
          // Process sales data
          const salesInvoiceNoCol = findColumnName(headers, COLUMN_MAPPINGS.SALES_INVOICE_NO);
          if (salesInvoiceNoCol && row[salesInvoiceNoCol]) {
            const saleQty = extractNumber(row, headers, COLUMN_MAPPINGS.SALES_QTY);
            const purchaseCostPerUnit = extractNumber(row, headers, COLUMN_MAPPINGS.PURCHASE_COST_PER_UNIT);
            const purchaseGstPercentage = extractNumber(row, headers, COLUMN_MAPPINGS.GST_PERCENTAGE);
            const mrpExGst = extractNumber(row, headers, COLUMN_MAPPINGS.MRP_EXCL_GST);
            const discountPercentage = extractNumber(row, headers, COLUMN_MAPPINGS.SALES_DISCOUNT);
            
            // Calculate derived values
            const purchaseTaxableValue = saleQty * purchaseCostPerUnit;
            let purchaseCgst = 0;
            let purchaseSgst = 0;
            let purchaseIgst = 0;
            
            if (purchaseGstPercentage > 0) {
              if (purchaseGstPercentage >= 0.1) { 
                purchaseCgst = purchaseTaxableValue * (purchaseGstPercentage / 2) / 100;
                purchaseSgst = purchaseTaxableValue * (purchaseGstPercentage / 2) / 100;
              } else {
                purchaseIgst = purchaseTaxableValue * purchaseGstPercentage;
              }
            }
            
            const totalPurchaseCost = purchaseTaxableValue + purchaseIgst + purchaseCgst + purchaseSgst;
            
            // Calculate discounted sales rate
            let discountedSalesRateExGst = mrpExGst;
            if (discountPercentage > 0 && mrpExGst > 0) {
              discountedSalesRateExGst = mrpExGst * (1 - discountPercentage / 100);
            }
            
            const sale: Sale = {
              id: uuidv4(),
              product_id: product.id,
              product_name: productName,
              hsn_code: hsnCode,
              unit: units,
              date: extractDate(row, headers, COLUMN_MAPPINGS.SALES_DATE),
              invoice_no: row[salesInvoiceNoCol]?.toString() || '',
              quantity: saleQty,
              qty: saleQty,
              sales_qty: saleQty,
              purchase_cost_per_unit_ex_gst: purchaseCostPerUnit,
              purchase_gst_percentage: purchaseGstPercentage,
              purchase_taxable_value: purchaseTaxableValue,
              purchase_igst: purchaseIgst,
              purchase_cgst: purchaseCgst,
              purchase_sgst: purchaseSgst,
              total_purchase_cost: totalPurchaseCost,
              mrp_incl_gst: extractNumber(row, headers, COLUMN_MAPPINGS.MRP_INCL_GST),
              mrp_ex_gst: mrpExGst,
              discount_percentage: discountPercentage,
              discounted_sales_rate_ex_gst: discountedSalesRateExGst,
              gst_percentage: extractNumber(row, headers, COLUMN_MAPPINGS.SALES_GST),
              taxable_value: extractNumber(row, headers, COLUMN_MAPPINGS.SALES_TAXABLE_VALUE),
              igst: extractNumber(row, headers, COLUMN_MAPPINGS.SALES_IGST),
              cgst: extractNumber(row, headers, COLUMN_MAPPINGS.SALES_CGST),
              sgst: extractNumber(row, headers, COLUMN_MAPPINGS.SALES_SGST),
              invoice_value: extractNumber(row, headers, COLUMN_MAPPINGS.SALES_INVOICE_VALUE),
              created_at: new Date().toISOString()
            };
            
            sales.push(sale);
          }
          
          // Process consumption data
          const consumptionVoucherNoCol = findColumnName(headers, COLUMN_MAPPINGS.CONSUMPTION_VOUCHER_NO);
          if (consumptionVoucherNoCol && row[consumptionVoucherNoCol]) {
            const consumptionQty = extractNumber(row, headers, COLUMN_MAPPINGS.CONSUMPTION_QTY);
            const purchaseCostPerUnit = extractNumber(row, headers, COLUMN_MAPPINGS.PURCHASE_COST_PER_UNIT);
            const purchaseGstPercentage = extractNumber(row, headers, COLUMN_MAPPINGS.GST_PERCENTAGE);
            
            // Calculate derived values
            const taxableValue = (consumptionQty || 0) * (purchaseCostPerUnit || 0);
            let cgstValue = 0;
            let sgstValue = 0;
            let igstValue = 0;
            
            if ((purchaseGstPercentage || 0) > 0) {
              if ((purchaseGstPercentage || 0) >= 0.1) {
                cgstValue = taxableValue * ((purchaseGstPercentage || 0) / 2) / 100;
                sgstValue = taxableValue * ((purchaseGstPercentage || 0) / 2) / 100;
              } else {
                igstValue = taxableValue * (purchaseGstPercentage || 0);
              }
            }
            
            const totalPurchaseCost = taxableValue + igstValue + cgstValue + sgstValue;
            
            const consumptionItem: Consumption = {
              id: uuidv4(),
              product_id: product.id,
              date: extractDate(row, headers, COLUMN_MAPPINGS.CONSUMPTION_DATE),
              product_name: productName,
              hsn_code: hsnCode,
              units: units,
              requisition_voucher_no: row[consumptionVoucherNoCol]?.toString() || '',
              quantity: consumptionQty,
              qty: consumptionQty,
              consumption_qty: consumptionQty,
              purchase_cost_per_unit_ex_gst: purchaseCostPerUnit,
              purchase_gst_percentage: purchaseGstPercentage,
              purchase_taxable_value: taxableValue,
              purchase_cgst: cgstValue,
              purchase_sgst: sgstValue,
              total_purchase_cost: totalPurchaseCost,
              taxable_value: taxableValue,
              igst: igstValue,
              cgst: cgstValue,
              sgst: sgstValue,
              invoice_value: totalPurchaseCost,
              created_at: new Date().toISOString()
            };
            
            consumption.push(consumptionItem);
          }
        }
        
        // Calculate balance stock for each product
        products.forEach(product => {
          const productName = product.name || '';
          const productId = product.id || '';
          const hsnCode = product.hsn_code || '';
          const units = product.units || '';
          
          const productPurchases = purchases.filter(p => p.product_id === productId);
          const productSales = sales.filter(s => s.product_id === productId);
          const productConsumption = consumption.filter(c => c.product_id === productId);
          
          const totalPurchaseQty = productPurchases.reduce((sum, p) => sum + (p.qty || 0), 0);
          const totalSalesQty = productSales.reduce((sum, s) => sum + (s.qty || 0), 0);
          const totalConsumptionQty = productConsumption.reduce((sum, c) => sum + (c.qty || 0), 0);
          
          const balanceQty = totalPurchaseQty - (totalSalesQty + totalConsumptionQty);
          
          // Only create balance stock if there's actual stock
          if (balanceQty > 0) {
            const totalPurchaseValue = productPurchases.reduce((sum, p) => sum + (p.taxable_value || 0), 0);
            const avgCostPerUnit = totalPurchaseQty > 0 ? totalPurchaseValue / totalPurchaseQty : 0;
            
            const balanceValue = balanceQty * avgCostPerUnit;
            const balanceGst = productPurchases.length > 0 ? (productPurchases[0].gst_percentage || 0) : 0;
            
            let balanceCgst = 0;
            let balanceSgst = 0;
            let balanceIgst = 0;
            
            if (balanceGst > 0) {
              if (balanceGst >= 0.1) {
                balanceCgst = balanceValue * (balanceGst / 2) / 100;
                balanceSgst = balanceValue * (balanceGst / 2) / 100;
              } else {
                balanceIgst = balanceValue * balanceGst;
              }
            }
            
            balanceStock.push({
              id: uuidv4(),
              product_id: productId,
              product_name: productName,
              hsn_code: hsnCode,
              units: units,
              unit: units,
              balance_qty: balanceQty,
              qty: balanceQty,
              closing_stock: balanceQty,
              opening_stock: 0,
              purchases: totalPurchaseQty,
              sales: totalSalesQty,
              consumption: totalConsumptionQty,
              balance_value: balanceValue,
              avg_rate: avgCostPerUnit,
              taxable_value: balanceValue,
              igst: balanceIgst,
              cgst: balanceCgst,
              sgst: balanceSgst,
              invoice_value: balanceValue + balanceIgst + balanceCgst + balanceSgst,
              last_updated: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          }
        });
        
        // Return the parsed data
        resolve({
          products,
          purchases,
          sales,
          consumption,
          balanceStock
        });
        
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };
    
    reader.readAsBinaryString(file);
  });
}

// Helper function to extract a date from a row
function extractDate(row: Record<string, any>, headers: string[], possibleColumns: string[]): string {
  const col = findColumnName(headers, possibleColumns);
  if (!col || !row[col]) return new Date().toISOString();
  
  try {
    // Handle Excel date serial numbers
    if (typeof row[col] === 'number') {
      // Excel dates are stored as days since Dec 30, 1899
      const date = new Date((row[col] - 25569) * 86400 * 1000);
      return date.toISOString();
    }
    
    // Handle date strings
    const date = new Date(row[col]);
    return date.toISOString();
  } catch (error) {
    return new Date().toISOString();
  }
}

// Helper function to extract a number from a row
function extractNumber(row: Record<string, any>, headers: string[], possibleColumns: string[]): number {
  const col = findColumnName(headers, possibleColumns);
  if (!col || row[col] === undefined || row[col] === '') return 0;
  
  // Handle different number formats
  if (typeof row[col] === 'number') {
    return row[col];
  }
  
  // Try to parse string as number
  const parsed = parseFloat(row[col].toString().replace(/,/g, ''));
  return isNaN(parsed) ? 0 : parsed;
} 