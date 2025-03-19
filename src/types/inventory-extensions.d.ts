import { Purchase, Sale, Consumption, BalanceStock, Product } from '../models/inventoryTypes';

// Add missing properties to existing types
declare module '../models/inventoryTypes' {
  interface Purchase {
    // Additional properties used in the app
    product_id?: string;
    purchase_id?: string;
    purchase_invoice_number?: string;
    qty?: number;
    price_incl_gst?: number;
    price_ex_gst?: number;
    discount_percentage?: number;
    purchase_cost_per_unit_ex_gst?: number;
    taxable_value?: number;
    cgst?: number;
    sgst?: number;
    igst?: number;
    invoice_value?: number;
    // Properties added for model compatibility
    purchase_sgst?: number;
    purchase_cgst?: number;
    purchase_igst?: number;
    purchase_taxable_value?: number;
  }

  interface Sale {
    // Additional properties used in the app
    product_id?: string;
    sale_id?: string;
    product_name?: string;
    hsn_code?: string;
    unit?: string;
    qty?: number;
    sales_qty?: number;
    purchase_cost_per_unit_ex_gst?: number;
    purchase_gst_percentage?: number;
    purchase_taxable_value?: number;
    purchase_cgst?: number;
    purchase_sgst?: number;
    purchase_igst?: number;
    total_purchase_cost?: number;
    discount_on_sales_percentage?: number;
    discounted_sales_rate_ex_gst?: number;
    discounted_sales_rate_excl_gst?: number;
    mrp_ex_gst?: number;
    sales_gst_percentage?: number;
    sales_taxable_value?: number;
    sales_cgst?: number;
    sales_sgst?: number;
    igst_rs?: number;
    cgst_rs?: number;
    sgst_rs?: number;
    invoice_value_rs?: number;
  }

  interface Consumption {
    // Additional properties used in the app
    product_id?: string;
    consumption_id?: string;
    requisition_voucher_no?: string;
    qty?: number;
    consumption_qty?: number;
    purchase_cost_per_unit_ex_gst?: number;
    purchase_gst_percentage?: number;
    purchase_taxable_value?: number;
    purchase_cgst?: number;
    purchase_sgst?: number;
    total_purchase_cost?: number;
    balance_qty?: number;
    cgst_rs?: number;
    sgst_rs?: number;
  }

  interface BalanceStock {
    // Additional properties used in the app
    product_id?: string;
    product_name?: string;
    hsn_code?: string;
    unit?: string;
    qty?: number;
    balance_qty?: number;
    taxable_value?: number;
    cgst?: number;
    sgst?: number;
    igst?: number;
    invoice_value?: number;
    avg_rate?: number;
    balance_value?: number;
  }

  interface Product {
    // Additional properties used in the app
    hsn_code?: string;
    units?: string;
    name?: string;
    collection_id?: string;
    price?: number;
    cost?: number;
    stock?: number;
    status?: string;
  }

  interface ProcessingStats {
    // Fix type issues with errors property
    errors: any[];
    total: number;
    processed: number;
    succeeded: number;
    failed: number;
  }
} 