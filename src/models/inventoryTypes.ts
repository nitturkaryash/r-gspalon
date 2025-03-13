// Collection represents a category or group of products
export interface Collection {
  id: string;
  name: string;
  description: string;
  created_at?: string;
}

// Product represents an inventory item
export interface Product {
  id: string;
  name: string;
  hsn_code: string;
  units: string;
  created_at?: string;
}

// Stock In - Purchases
export interface Purchase {
  id: string;
  date: string;
  product_id: string;
  invoice_no: string;
  qty: number;
  price_incl_gst: number;
  price_ex_gst: number;
  discount_percentage: number;
  purchase_cost_per_unit_ex_gst: number;
  gst_percentage: number;
  taxable_value: number;
  igst: number;
  cgst: number;
  sgst: number;
  invoice_value: number;
  created_at?: string;
}

// Stock Out - Sales to customers
export interface Sale {
  id: string;
  date: string;
  product_id: string;
  invoice_no: string;
  qty: number;
  purchase_cost_per_unit_ex_gst: number;
  purchase_gst_percentage: number;
  purchase_taxable_value: number;
  purchase_igst: number;
  purchase_cgst: number;
  purchase_sgst: number;
  total_purchase_cost: number;
  mrp_incl_gst: number;
  mrp_ex_gst: number;
  discount_percentage: number;
  discounted_sales_rate_ex_gst: number;
  sales_gst_percentage: number;
  sales_taxable_value: number;
  sales_igst: number;
  sales_cgst: number;
  sales_sgst: number;
  invoice_value: number;
  created_at?: string;
}

// Stock Out - Salon consumption
export interface Consumption {
  id: string;
  date: string;
  product_id: string;
  requisition_voucher_no: string;
  qty: number;
  purchase_cost_per_unit_ex_gst: number;
  purchase_gst_percentage: number;
  taxable_value: number;
  igst: number;
  cgst: number;
  sgst: number;
  total_purchase_cost: number;
  created_at?: string;
}

// Balance stock 
export interface BalanceStock {
  id: string;
  product_id: string;
  qty: number;
  taxable_value: number;
  igst: number;
  cgst: number;
  sgst: number;
  invoice_value: number;
  created_at?: string;
  updated_at?: string;
}

// Excel export interface
export interface StockDetailsExport {
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

// Processing stats for excel import
export interface ProcessingStats {
  productsProcessed: number;
  purchasesProcessed: number;
  salesProcessed: number;
  consumptionProcessed: number;
  balanceStockUpdated: number;
}

// Structure for normalized excel data
export interface ExcelData {
  purchases: Purchase[];
  sales: Sale[];
  consumption: Consumption[];
  balanceStock: BalanceStock[];
  products: Product[];
}

// Calculate profit for a product
export const calculateProfit = (price: number, cost: number): number => {
  return parseFloat((price - cost).toFixed(2));
};

// Calculate profit margin as a percentage
export const calculateProfitMargin = (price: number, cost: number): number => {
  if (price <= 0) return 0;
  return parseFloat((((price - cost) / price) * 100).toFixed(2));
}; 