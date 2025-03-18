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

// Inventory Types for R&G Salon

// Common interface for shared properties
interface InventoryBase {
  product_name: string;
  hsn_code?: string;
  units?: string;
  date?: string;
}

// Table 1: Purchases (Manual Input)
export interface Purchase extends InventoryBase {
  purchase_id?: string;
  purchase_invoice_number?: string;
  purchase_qty: number;
  mrp_incl_gst?: number;
  mrp_excl_gst?: number;
  discount_on_purchase_percentage?: number;
  gst_percentage?: number;
  purchase_taxable_value?: number;
  purchase_igst?: number;
  purchase_cgst?: number;
  purchase_sgst?: number;
  purchase_invoice_value_rs?: number;
  created_at?: string;
  updated_at?: string;
}

// Table 2: Sales (Auto-Fetched from POS)
export interface Sale extends InventoryBase {
  sale_id?: string;
  invoice_no?: string;
  sales_qty: number;
  purchase_cost_per_unit_ex_gst?: number;
  purchase_gst_percentage?: number;
  purchase_taxable_value?: number;
  purchase_cgst?: number;
  purchase_sgst?: number;
  total_purchase_cost?: number;
  mrp_incl_gst?: number;
  mrp_excl_gst?: number;
  discount_on_sales_percentage?: number;
  discounted_sales_rate_excl_gst?: number;
  sales_gst_percentage?: number;
  sales_taxable_value?: number;
  igst_rs?: number;
  cgst_rs?: number;
  sgst_rs?: number;
  invoice_value_rs?: number;
  created_at?: string;
  updated_at?: string;
}

// Table 3: Consumption (Auto-Fetched with POS Option)
export interface Consumption extends InventoryBase {
  consumption_id?: string;
  requisition_voucher_no?: string;
  consumption_qty: number;
  purchase_cost_per_unit_ex_gst?: number;
  purchase_gst_percentage?: number;
  purchase_taxable_value?: number;
  purchase_cgst?: number;
  purchase_sgst?: number;
  total_purchase_cost?: number;
  balance_qty?: number;
  taxable_value?: number;
  cgst_rs?: number;
  sgst_rs?: number;
  invoice_value?: number;
  created_at?: string;
  updated_at?: string;
}

// Balance Stock View
export interface BalanceStock {
  product_name: string;
  hsn_code?: string;
  units?: string;
  total_purchases: number;
  total_sales: number;
  total_consumption: number;
  balance_qty: number;
  avg_purchase_cost_per_unit?: number;
}

// Form state for purchase entry
export interface PurchaseFormState {
  date: string;
  product_name: string;
  hsn_code: string;
  units: string;
  purchase_invoice_number: string;
  purchase_qty: number;
  mrp_incl_gst: number;
  mrp_excl_gst?: number;
  discount_on_purchase_percentage: number;
  gst_percentage: number;
  purchase_taxable_value?: number;
  purchase_igst?: number;
  purchase_cgst?: number;
  purchase_sgst?: number;
  purchase_invoice_value_rs?: number;
}

// Stats for processing inventory data
export interface ProcessingStats {
  processingStart: string;
  processingEnd: string;
  totalPurchases: number;
  totalSales: number;
  totalConsumption: number;
  errors: string[];
}

// CSV export data structure
export interface InventoryExportData {
  purchases: Purchase[];
  sales: Sale[];
  consumption: Consumption[];
  balanceStock: BalanceStock[];
}

// Excel export interface
export interface StockDetailsExport {
  product_name: string;
  hsn_code: string;
  units: string;
  transaction_type: 'purchase' | 'sale' | 'consumption';
  date: string;
  document_no: string;
  qty: number;
  rate: number;
  value: number;
  balance_qty: number;
  balance_value: number;
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