import * as XLSX from 'xlsx';
/**
 * Generate an Excel file with all inventory data in the STOCK DETAILS format
 */
export function generateStockDetailsExcel(products, purchases, sales, consumption, balanceStock) {
    // Create a new workbook
    const workbook = XLSX.utils.book_new();
    // Create data for the main sheet
    const sheetData = [];
    // Add title row
    sheetData.push({
        A: 'STOCK DETAILS'
    });
    // Add category headers
    sheetData.push({
        A: '',
        B: '',
        C: '',
        D: '',
        E: 'PURCHASE - STOCK IN',
        F: '',
        G: '',
        H: '',
        I: '',
        J: '',
        K: '',
        L: '',
        M: '',
        N: '',
        O: '',
        P: '',
        Q: 'SALES TO CUSTOMER - STOCK OUT',
        R: '',
        S: '',
        T: '',
        U: '',
        V: '',
        W: '',
        X: '',
        Y: '',
        Z: '',
        AA: '',
        AB: '',
        AC: '',
        AD: '',
        AE: '',
        AF: '',
        AG: 'SALON CONSUMPTION - STOCK OUT',
        AH: '',
        AI: '',
        AJ: '',
        AK: '',
        AL: '',
        AM: '',
        AN: '',
        AO: '',
        AP: ''
    });
    // Add column headers
    const headers = {
        A: 'S.No.',
        B: '',
        C: 'Product Name',
        D: 'HSN Code',
        E: 'UNITS',
        // Purchase headers
        F: 'Purchase Date',
        G: 'Purchase Invoice No.',
        H: 'Purchase Qty.',
        I: 'MRP Incl. GST',
        J: 'MRP Excl. GST',
        K: 'Discount on Purchase %',
        L: 'Purchase Cost per Unit',
        M: 'GST %',
        N: 'Purchase Taxable Value',
        O: 'Purchases CGST',
        P: 'Purchases SGST',
        Q: 'Purchase Invoice Value',
        // Sales headers
        R: 'Sales Date',
        S: 'Sales Invoice No.',
        T: 'Sales Qty.',
        U: 'MRP Incl. GST',
        V: 'MRP Excl. GST',
        W: 'Discount on Sales %',
        X: 'Sales Rate',
        Y: 'GST %',
        Z: 'Sales Taxable Value',
        AA: 'Sales CGST',
        AB: 'Sales SGST',
        AC: 'Sales Invoice Value',
        // Consumption headers
        AD: 'Consumption Date',
        AE: 'Requisition Voucher No.',
        AF: 'Consumption Qty.',
        AG: 'Purchase Cost per Unit',
        AH: 'GST %',
        AI: 'Taxable Value',
        AJ: 'CGST',
        AK: 'SGST',
        AL: 'Total Value'
    };
    sheetData.push(headers);
    // Create a map of products by ID for easy lookup
    const productsMap = new Map();
    products.forEach(product => {
        productsMap.set(product.id, product);
    });
    // Process each product and its related transactions
    let serialNumber = 1;
    // First, gather all products that have any transactions
    const productIds = new Set([
        ...purchases.map(p => p.product_id),
        ...sales.map(s => s.product_id),
        ...consumption.map(c => c.product_id)
    ]);
    // Then process each product
    Array.from(productIds).forEach(productId => {
        const product = productsMap.get(productId);
        if (!product)
            return; // Skip if product not found
        // Get all transactions for this product
        const productPurchases = purchases.filter(p => p.product_id === productId);
        const productSales = sales.filter(s => s.product_id === productId);
        const productConsumption = consumption.filter(c => c.product_id === productId);
        // Determine the maximum number of transactions for this product
        const maxTransactions = Math.max(productPurchases.length, productSales.length, productConsumption.length, 1 // At least one row for each product
        );
        // Add rows for each transaction
        for (let i = 0; i < maxTransactions; i++) {
            const purchase = productPurchases[i];
            const sale = productSales[i];
            const consumptionItem = productConsumption[i];
            const row = {
                A: serialNumber,
                C: product.name,
                D: product.hsn_code,
                E: product.units
            };
            // Add purchase data if available
            if (purchase) {
                row.F = new Date(purchase.date); // Format as date
                row.G = purchase.invoice_no;
                row.H = purchase.qty;
                row.I = purchase.price_incl_gst;
                row.J = purchase.price_ex_gst;
                row.K = purchase.discount_percentage;
                row.L = purchase.purchase_cost_per_unit_ex_gst;
                row.M = purchase.gst_percentage;
                row.N = purchase.taxable_value;
                row.O = purchase.cgst;
                row.P = purchase.sgst;
                row.Q = purchase.invoice_value;
            }
            // Add sales data if available
            if (sale) {
                row.R = new Date(sale.date); // Format as date
                row.S = sale.invoice_no;
                row.T = sale.qty;
                row.U = sale.mrp_incl_gst;
                row.V = sale.mrp_ex_gst;
                row.W = sale.discount_percentage;
                row.X = sale.discounted_sales_rate_ex_gst;
                row.Y = sale.sales_gst_percentage;
                row.Z = sale.sales_taxable_value;
                row.AA = sale.sales_cgst;
                row.AB = sale.sales_sgst;
                row.AC = sale.invoice_value;
            }
            // Add consumption data if available
            if (consumptionItem) {
                row.AD = new Date(consumptionItem.date); // Format as date
                row.AE = consumptionItem.requisition_voucher_no;
                row.AF = consumptionItem.qty;
                row.AG = consumptionItem.purchase_cost_per_unit_ex_gst;
                row.AH = consumptionItem.purchase_gst_percentage;
                row.AI = consumptionItem.taxable_value;
                row.AJ = consumptionItem.cgst;
                row.AK = consumptionItem.sgst;
                row.AL = consumptionItem.total_purchase_cost;
            }
            sheetData.push(row);
            serialNumber++;
        }
    });
    // Create the main worksheet
    const worksheet = XLSX.utils.json_to_sheet(sheetData, { skipHeader: true });
    // Set column widths
    const columnWidths = [
        { wch: 5 }, // A - S.No.
        { wch: 5 }, // B - Empty
        { wch: 30 }, // C - Product Name
        { wch: 12 }, // D - HSN Code
        { wch: 10 }, // E - UNITS
        // Purchase columns
        { wch: 12 }, // F - Purchase Date
        { wch: 15 }, // G - Purchase Invoice No.
        { wch: 12 }, // H - Purchase Qty.
        { wch: 12 }, // I - MRP Incl. GST
        { wch: 12 }, // J - MRP Excl. GST
        { wch: 15 }, // K - Discount on Purchase %
        { wch: 18 }, // L - Purchase Cost per Unit
        { wch: 8 }, // M - GST %
        { wch: 18 }, // N - Purchase Taxable Value
        { wch: 15 }, // O - Purchases CGST
        { wch: 15 }, // P - Purchases SGST
        { wch: 18 }, // Q - Purchase Invoice Value
        // Sales columns
        { wch: 12 }, // R - Sales Date
        { wch: 15 }, // S - Sales Invoice No.
        { wch: 12 }, // T - Sales Qty.
        { wch: 12 }, // U - MRP Incl. GST
        { wch: 12 }, // V - MRP Excl. GST
        { wch: 15 }, // W - Discount on Sales %
        { wch: 12 }, // X - Sales Rate
        { wch: 8 }, // Y - GST %
        { wch: 18 }, // Z - Sales Taxable Value
        { wch: 12 }, // AA - Sales CGST
        { wch: 12 }, // AB - Sales SGST
        { wch: 15 }, // AC - Sales Invoice Value
        // Consumption columns
        { wch: 15 }, // AD - Consumption Date
        { wch: 18 }, // AE - Requisition Voucher No.
        { wch: 15 }, // AF - Consumption Qty.
        { wch: 18 }, // AG - Purchase Cost per Unit
        { wch: 8 }, // AH - GST %
        { wch: 15 }, // AI - Taxable Value
        { wch: 10 }, // AJ - CGST
        { wch: 10 }, // AK - SGST
        { wch: 12 } // AL - Total Value
    ];
    worksheet['!cols'] = columnWidths;
    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'STOCK DETAILS');
    // Create a balance stock summary sheet
    if (balanceStock.length > 0) {
        const balanceData = balanceStock.map((item, index) => {
            const product = productsMap.get(item.product_id);
            return {
                'S.No.': index + 1,
                'Product Name': product ? product.name : 'Unknown',
                'HSN Code': product ? product.hsn_code : '',
                'UNITS': product ? product.units : '',
                'Quantity': item.qty,
                'Taxable Value': item.taxable_value,
                'CGST': item.cgst,
                'SGST': item.sgst,
                'IGST': item.igst,
                'Total Value': item.invoice_value
            };
        });
        const balanceSheet = XLSX.utils.json_to_sheet(balanceData);
        XLSX.utils.book_append_sheet(workbook, balanceSheet, 'Balance Stock');
    }
    return workbook;
}
/**
 * Export inventory data to an Excel file and trigger download
 */
export function exportInventoryToExcel(products, purchases, sales, consumption, balanceStock, filename = 'Salon_Inventory_Transactions.xlsx') {
    // Generate workbook
    const workbook = generateStockDetailsExcel(products, purchases, sales, consumption, balanceStock);
    // Ensure filename has .xlsx extension
    if (!filename.endsWith('.xlsx')) {
        filename += '.xlsx';
    }
    // Write file and trigger download
    XLSX.writeFile(workbook, filename);
}
