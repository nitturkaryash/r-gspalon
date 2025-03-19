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
  collection_id?: string;
  name?: string;
  price?: number;
  cost?: number;
  stock?: number;
  status?: 'active' | 'inactive';
  created_at?: string;
}

// Inventory types
export interface Purchase {
  id: string;
  date: string;
  product_name?: string;
  hsn_code?: string;
  units?: string;
  purchase_qty?: number;
  mrp_incl_gst?: number;
  mrp_excl_gst?: number;
  gst_percentage?: number;
  purchase_taxable_value?: number;
  purchase_igst?: number;
  purchase_cgst?: number;
  purchase_sgst?: number;
  purchase_invoice_value_rs?: number;
  discount_on_purchase_percentage?: number;
  vendor_name?: string;
  invoice_no?: string;
  created_at: string;
  updated_at?: string;
}

export interface Sale {
  id: string;
  date: string;
  product_name?: string;
  hsn_code?: string;
  units?: string;
  unit?: string;
  quantity?: number;
  mrp_incl_gst?: number;
  mrp_excl_gst?: number;
  discount_percentage?: number;
  gst_percentage?: number;
  taxable_value?: number;
  igst?: number;
  cgst?: number;
  sgst?: number;
  invoice_value?: number;
  invoice_no?: string;
  created_at: string;
  updated_at?: string;
}

export interface Consumption {
  id: string;
  date: string;
  product_name?: string;
  hsn_code?: string;
  units?: string;
  quantity?: number;
  mrp_incl_gst?: number;
  mrp_excl_gst?: number;
  gst_percentage?: number;
  taxable_value?: number;
  igst?: number;
  cgst?: number;
  sgst?: number;
  invoice_value?: number;
  purpose?: string;
  created_at: string;
  updated_at?: string;
}

export interface BalanceStock {
  id: string;
  product_name?: string;
  hsn_code?: string;
  units?: string;
  opening_stock?: number;
  purchases?: number;
  sales?: number;
  consumption?: number;
  closing_stock?: number;
  last_updated?: string;
  updated_at?: string;
  unit?: string;
  balance_qty?: number;
  balance_value?: number;
  avg_rate?: number;
}

export interface PurchaseFormState {
  date: string;
  product_name: string;
  hsn_code: string;
  units: string;
  purchase_qty: number;
  mrp_incl_gst: number;
  gst_percentage: number;
  discount_on_purchase_percentage: number;
  vendor_name: string;
  invoice_no: string;
  purchase_invoice_number?: string;
  purchase_taxable_value?: number;
  purchase_igst?: number;
  purchase_cgst?: number;
  purchase_sgst?: number;
  purchase_invoice_value_rs?: number;
}

export interface ProcessingStats {
  total: number;
  processed: number;
  succeeded: number;
  failed: number;
  errors: any[];
  startTime?: Date;
  endTime?: Date | null;
}

export interface InventoryExportData {
  purchases: Purchase[];
  sales: Sale[];
  consumption: Consumption[];
  balanceStock: BalanceStock[];
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