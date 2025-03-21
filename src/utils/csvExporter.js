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
// Format date for CSV
const formatDate = (date) => {
    if (!date)
        return '';
    try {
        return new Date(date).toLocaleDateString('en-IN');
    }
    catch (error) {
        return '';
    }
};
// Format number for CSV
const formatNumber = (value) => {
    if (value === undefined || value === null)
        return '';
    return value.toFixed(2);
};
// Generate CSV data
export const generateCsvData = (data) => {
    const { purchases, sales, consumption, balanceStock } = data;
    // Create a map of products to their balance stock
    const balanceStockMap = new Map();
    balanceStock.forEach(item => {
        balanceStockMap.set(item.product_name, item);
    });
    // Start with headers
    let csvContent = CSV_HEADERS.join(',') + '\n';
    // Process purchases
    purchases.forEach(purchase => {
        const row = [];
        // Purchases columns
        row.push(`"${formatDate(purchase.date)}"`);
        row.push(`"${purchase.product_name || ''}"`);
        row.push(`"${purchase.hsn_code || ''}"`);
        row.push(`"${purchase.units || ''}"`);
        row.push(`"${purchase.purchase_invoice_number || ''}"`);
        row.push(formatNumber(purchase.purchase_qty));
        row.push(formatNumber(purchase.mrp_incl_gst));
        row.push(formatNumber(purchase.mrp_excl_gst));
        row.push(formatNumber(purchase.discount_on_purchase_percentage));
        row.push(formatNumber(purchase.gst_percentage));
        row.push(formatNumber(purchase.purchase_taxable_value));
        row.push(formatNumber(purchase.purchase_igst));
        row.push(formatNumber(purchase.purchase_cgst));
        row.push(formatNumber(purchase.purchase_sgst));
        row.push(formatNumber(purchase.purchase_invoice_value_rs));
        // Empty cells for sales and consumption columns
        for (let i = 0; i < 34; i++) {
            row.push('');
        }
        csvContent += row.join(',') + '\n';
    });
    // Process sales
    sales.forEach(sale => {
        const row = [];
        // Purchases columns (empty)
        for (let i = 0; i < 15; i++) {
            row.push('');
        }
        // Sales columns
        row.push(`"${sale.invoice_no || ''}"`);
        row.push(formatNumber(sale.sales_qty));
        row.push(formatNumber(sale.purchase_cost_per_unit_ex_gst));
        row.push(formatNumber(sale.purchase_gst_percentage));
        row.push(formatNumber(sale.purchase_taxable_value));
        row.push(formatNumber(sale.purchase_cgst));
        row.push(formatNumber(sale.purchase_sgst));
        row.push(formatNumber(sale.total_purchase_cost));
        row.push(formatNumber(sale.mrp_incl_gst));
        row.push(formatNumber(sale.mrp_excl_gst));
        row.push(formatNumber(sale.discount_on_sales_percentage));
        row.push(formatNumber(sale.discounted_sales_rate_excl_gst));
        row.push(formatNumber(sale.sales_gst_percentage));
        row.push(formatNumber(sale.sales_taxable_value));
        row.push(formatNumber(sale.igst_rs));
        row.push(formatNumber(sale.cgst_rs));
        row.push(formatNumber(sale.sgst_rs));
        row.push(formatNumber(sale.invoice_value_rs));
        // Empty cells for consumption columns
        for (let i = 0; i < 15; i++) {
            row.push('');
        }
        csvContent += row.join(',') + '\n';
    });
    // Process consumption
    consumption.forEach(item => {
        const row = [];
        // Purchases columns (empty)
        for (let i = 0; i < 15; i++) {
            row.push('');
        }
        // Sales columns (empty)
        for (let i = 0; i < 19; i++) {
            row.push('');
        }
        // Consumption columns
        row.push(`"${item.requisition_voucher_no || ''}"`);
        row.push(formatNumber(item.consumption_qty));
        row.push(formatNumber(item.purchase_cost_per_unit_ex_gst));
        row.push(formatNumber(item.purchase_gst_percentage));
        row.push(formatNumber(item.purchase_taxable_value));
        row.push(formatNumber(item.purchase_cgst));
        row.push(formatNumber(item.purchase_sgst));
        row.push(formatNumber(item.total_purchase_cost));
        row.push(formatNumber(item.balance_qty));
        row.push(formatNumber(item.taxable_value));
        row.push(formatNumber(item.cgst_rs));
        row.push(formatNumber(item.sgst_rs));
        row.push(formatNumber(item.invoice_value));
        csvContent += row.join(',') + '\n';
    });
    // Process balance stock as a summary
    balanceStock.forEach(item => {
        const row = [];
        // Include product details
        row.push(`"${formatDate(new Date().toISOString())}"`); // Current date
        row.push(`"${item.product_name || ''}"`);
        row.push(`"${item.hsn_code || ''}"`);
        row.push(`"${item.units || ''}"`);
        row.push('"BALANCE STOCK"'); // Indicate this is a balance row
        row.push(formatNumber(item.balance_qty));
        // Fill other columns with empty values
        for (let i = 0; i < 43; i++) {
            row.push('');
        }
        csvContent += row.join(',') + '\n';
    });
    return csvContent;
};
// Download CSV file
export const downloadCsv = (data) => {
    const csvContent = generateCsvData(data);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    // Set link properties
    link.setAttribute('href', url);
    link.setAttribute('download', `inventory_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    // Append to document, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
