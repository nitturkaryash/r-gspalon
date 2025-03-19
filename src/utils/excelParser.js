import * as XLSX from 'xlsx';
import { v4 as uuidv4 } from 'uuid';
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
function findColumnName(headers, possibleNames) {
    for (const name of possibleNames) {
        if (headers.includes(name)) {
            return name;
        }
    }
    return null;
}
// Parse Excel file and extract stock details
export async function parseStockDetailsExcel(file) {
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
                });
                // Extract headers (typically row 2 and 3 combined)
                // This is an approximation - actual implementation may need adjustment based on file structure
                const headers = Array.from(new Set([
                    ...Object.values(rawData[1] || {}),
                    ...Object.values(rawData[2] || {})
                ])).filter(h => h !== '');
                // Initialize result containers
                const products = [];
                const purchases = [];
                const sales = [];
                const consumption = [];
                const balanceStock = [];
                // Process data rows (typically starting from row 4)
                for (let i = 3; i < rawData.length; i++) {
                    const row = rawData[i];
                    if (!row)
                        continue;
                    // Check if this is a data row (has product name)
                    const productNameCol = findColumnName(headers, COLUMN_MAPPINGS.PRODUCT_NAME);
                    if (!productNameCol || !row[productNameCol])
                        continue;
                    // Extract product information
                    const productName = row[productNameCol]?.toString() || '';
                    const hsnCodeCol = findColumnName(headers, COLUMN_MAPPINGS.HSN_CODE);
                    const hsnCode = hsnCodeCol ? row[hsnCodeCol]?.toString() || '' : '';
                    const unitsCol = findColumnName(headers, COLUMN_MAPPINGS.UNITS);
                    const units = unitsCol ? row[unitsCol]?.toString() || '' : '';
                    // Find or create product
                    let product = products.find(p => p.name === productName &&
                        p.hsn_code === hsnCode &&
                        p.units === units);
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
                        const purchase = {
                            id: uuidv4(),
                            product_id: product.id,
                            date: extractDate(row, headers, COLUMN_MAPPINGS.PURCHASE_DATE),
                            invoice_no: row[purchaseInvoiceNoCol]?.toString() || '',
                            qty: extractNumber(row, headers, COLUMN_MAPPINGS.PURCHASE_QTY),
                            price_incl_gst: extractNumber(row, headers, COLUMN_MAPPINGS.MRP_INCL_GST),
                            price_ex_gst: extractNumber(row, headers, COLUMN_MAPPINGS.MRP_EXCL_GST),
                            discount_percentage: extractNumber(row, headers, COLUMN_MAPPINGS.DISCOUNT_PERCENTAGE),
                            purchase_cost_per_unit_ex_gst: extractNumber(row, headers, COLUMN_MAPPINGS.PURCHASE_COST_PER_UNIT),
                            gst_percentage: extractNumber(row, headers, COLUMN_MAPPINGS.GST_PERCENTAGE),
                            taxable_value: extractNumber(row, headers, COLUMN_MAPPINGS.PURCHASE_TAXABLE_VALUE),
                            igst: extractNumber(row, headers, COLUMN_MAPPINGS.PURCHASE_IGST),
                            cgst: extractNumber(row, headers, COLUMN_MAPPINGS.PURCHASE_CGST),
                            sgst: extractNumber(row, headers, COLUMN_MAPPINGS.PURCHASE_SGST),
                            invoice_value: extractNumber(row, headers, COLUMN_MAPPINGS.PURCHASE_INVOICE_VALUE),
                            created_at: new Date().toISOString()
                        };
                        purchases.push(purchase);
                    }
                    // Process sales data
                    const salesInvoiceNoCol = findColumnName(headers, COLUMN_MAPPINGS.SALES_INVOICE_NO);
                    if (salesInvoiceNoCol && row[salesInvoiceNoCol]) {
                        const sale = {
                            id: uuidv4(),
                            product_id: product.id,
                            date: extractDate(row, headers, COLUMN_MAPPINGS.SALES_DATE),
                            invoice_no: row[salesInvoiceNoCol]?.toString() || '',
                            qty: extractNumber(row, headers, COLUMN_MAPPINGS.SALES_QTY),
                            purchase_cost_per_unit_ex_gst: extractNumber(row, headers, COLUMN_MAPPINGS.PURCHASE_COST_PER_UNIT),
                            purchase_gst_percentage: extractNumber(row, headers, COLUMN_MAPPINGS.GST_PERCENTAGE),
                            purchase_taxable_value: 0, // Will calculate later
                            purchase_igst: 0,
                            purchase_cgst: 0,
                            purchase_sgst: 0,
                            total_purchase_cost: 0, // Will calculate later
                            mrp_incl_gst: extractNumber(row, headers, COLUMN_MAPPINGS.MRP_INCL_GST),
                            mrp_ex_gst: extractNumber(row, headers, COLUMN_MAPPINGS.MRP_EXCL_GST),
                            discount_percentage: extractNumber(row, headers, COLUMN_MAPPINGS.SALES_DISCOUNT),
                            discounted_sales_rate_ex_gst: 0, // Will calculate later
                            sales_gst_percentage: extractNumber(row, headers, COLUMN_MAPPINGS.SALES_GST),
                            sales_taxable_value: extractNumber(row, headers, COLUMN_MAPPINGS.SALES_TAXABLE_VALUE),
                            sales_igst: extractNumber(row, headers, COLUMN_MAPPINGS.SALES_IGST),
                            sales_cgst: extractNumber(row, headers, COLUMN_MAPPINGS.SALES_CGST),
                            sales_sgst: extractNumber(row, headers, COLUMN_MAPPINGS.SALES_SGST),
                            invoice_value: extractNumber(row, headers, COLUMN_MAPPINGS.SALES_INVOICE_VALUE),
                            created_at: new Date().toISOString()
                        };
                        // Calculate derived values
                        sale.purchase_taxable_value = sale.qty * sale.purchase_cost_per_unit_ex_gst;
                        if (sale.purchase_gst_percentage > 0) {
                            if (sale.purchase_gst_percentage >= 0.1) { // Assuming it's in percentage, not decimal
                                sale.purchase_cgst = sale.purchase_taxable_value * (sale.purchase_gst_percentage / 2) / 100;
                                sale.purchase_sgst = sale.purchase_taxable_value * (sale.purchase_gst_percentage / 2) / 100;
                            }
                            else {
                                sale.purchase_igst = sale.purchase_taxable_value * sale.purchase_gst_percentage;
                            }
                        }
                        sale.total_purchase_cost = sale.purchase_taxable_value + sale.purchase_igst + sale.purchase_cgst + sale.purchase_sgst;
                        // Calculate discounted sales rate if not provided
                        if (sale.discount_percentage > 0 && sale.mrp_ex_gst > 0) {
                            sale.discounted_sales_rate_ex_gst = sale.mrp_ex_gst * (1 - sale.discount_percentage / 100);
                        }
                        else {
                            sale.discounted_sales_rate_ex_gst = sale.mrp_ex_gst;
                        }
                        sales.push(sale);
                    }
                    // Process consumption data
                    const consumptionVoucherNoCol = findColumnName(headers, COLUMN_MAPPINGS.CONSUMPTION_VOUCHER_NO);
                    if (consumptionVoucherNoCol && row[consumptionVoucherNoCol]) {
                        const consumptionItem = {
                            id: uuidv4(),
                            product_id: product.id,
                            date: extractDate(row, headers, COLUMN_MAPPINGS.CONSUMPTION_DATE),
                            requisition_voucher_no: row[consumptionVoucherNoCol]?.toString() || '',
                            qty: extractNumber(row, headers, COLUMN_MAPPINGS.CONSUMPTION_QTY),
                            purchase_cost_per_unit_ex_gst: extractNumber(row, headers, COLUMN_MAPPINGS.PURCHASE_COST_PER_UNIT),
                            purchase_gst_percentage: extractNumber(row, headers, COLUMN_MAPPINGS.GST_PERCENTAGE),
                            taxable_value: 0, // Will calculate later
                            igst: 0,
                            cgst: 0,
                            sgst: 0,
                            total_purchase_cost: 0, // Will calculate later
                            created_at: new Date().toISOString()
                        };
                        // Calculate derived values
                        consumptionItem.taxable_value = consumptionItem.qty * consumptionItem.purchase_cost_per_unit_ex_gst;
                        if (consumptionItem.purchase_gst_percentage > 0) {
                            if (consumptionItem.purchase_gst_percentage >= 0.1) { // Assuming it's in percentage, not decimal
                                consumptionItem.cgst = consumptionItem.taxable_value * (consumptionItem.purchase_gst_percentage / 2) / 100;
                                consumptionItem.sgst = consumptionItem.taxable_value * (consumptionItem.purchase_gst_percentage / 2) / 100;
                            }
                            else {
                                consumptionItem.igst = consumptionItem.taxable_value * consumptionItem.purchase_gst_percentage;
                            }
                        }
                        consumptionItem.total_purchase_cost = consumptionItem.taxable_value + consumptionItem.igst + consumptionItem.cgst + consumptionItem.sgst;
                        consumption.push(consumptionItem);
                    }
                }
                // Calculate balance stock for each product
                products.forEach(product => {
                    const productPurchases = purchases.filter(p => p.product_id === product.id);
                    const productSales = sales.filter(s => s.product_id === product.id);
                    const productConsumption = consumption.filter(c => c.product_id === product.id);
                    const totalPurchaseQty = productPurchases.reduce((sum, p) => sum + p.qty, 0);
                    const totalSalesQty = productSales.reduce((sum, s) => sum + s.qty, 0);
                    const totalConsumptionQty = productConsumption.reduce((sum, c) => sum + c.qty, 0);
                    const balanceQty = totalPurchaseQty - (totalSalesQty + totalConsumptionQty);
                    // Only create balance stock if there's actual stock
                    if (balanceQty > 0) {
                        const totalPurchaseValue = productPurchases.reduce((sum, p) => sum + p.taxable_value, 0);
                        const avgCostPerUnit = totalPurchaseValue / totalPurchaseQty;
                        const balanceValue = balanceQty * avgCostPerUnit;
                        const balanceGst = productPurchases.length > 0 ? productPurchases[0].gst_percentage : 0;
                        let balanceCgst = 0;
                        let balanceSgst = 0;
                        let balanceIgst = 0;
                        if (balanceGst > 0) {
                            if (balanceGst >= 0.1) { // Assuming it's in percentage, not decimal
                                balanceCgst = balanceValue * (balanceGst / 2) / 100;
                                balanceSgst = balanceValue * (balanceGst / 2) / 100;
                            }
                            else {
                                balanceIgst = balanceValue * balanceGst;
                            }
                        }
                        balanceStock.push({
                            id: uuidv4(),
                            product_id: product.id,
                            qty: balanceQty,
                            taxable_value: balanceValue,
                            igst: balanceIgst,
                            cgst: balanceCgst,
                            sgst: balanceSgst,
                            invoice_value: balanceValue + balanceIgst + balanceCgst + balanceSgst,
                            created_at: new Date().toISOString(),
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
            }
            catch (error) {
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
function extractDate(row, headers, possibleColumns) {
    const col = findColumnName(headers, possibleColumns);
    if (!col || !row[col])
        return new Date().toISOString();
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
    }
    catch (error) {
        return new Date().toISOString();
    }
}
// Helper function to extract a number from a row
function extractNumber(row, headers, possibleColumns) {
    const col = findColumnName(headers, possibleColumns);
    if (!col || row[col] === undefined || row[col] === '')
        return 0;
    // Handle different number formats
    if (typeof row[col] === 'number') {
        return row[col];
    }
    // Try to parse string as number
    const parsed = parseFloat(row[col].toString().replace(/,/g, ''));
    return isNaN(parsed) ? 0 : parsed;
}
