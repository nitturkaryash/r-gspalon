-- Inventory Schema for R&G Salon

-- Table 1: Purchases (Manual Input)
CREATE TABLE IF NOT EXISTS inventory_purchases (
  purchase_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date TIMESTAMP NOT NULL DEFAULT NOW(),
  product_name TEXT NOT NULL,
  hsn_code TEXT,
  units TEXT,
  purchase_invoice_number TEXT,
  purchase_qty INTEGER NOT NULL,
  mrp_incl_gst FLOAT,
  mrp_excl_gst FLOAT,
  discount_on_purchase_percentage FLOAT DEFAULT 0,
  gst_percentage FLOAT DEFAULT 18,
  purchase_taxable_value FLOAT,
  purchase_igst FLOAT DEFAULT 0,
  purchase_cgst FLOAT,
  purchase_sgst FLOAT,
  purchase_invoice_value_rs FLOAT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table 2: Sales (Auto-Fetched from POS)
CREATE TABLE IF NOT EXISTS inventory_sales (
  sale_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date TIMESTAMP NOT NULL DEFAULT NOW(),
  product_name TEXT NOT NULL,
  hsn_code TEXT,
  units TEXT,
  invoice_no TEXT,
  sales_qty INTEGER NOT NULL,
  purchase_cost_per_unit_ex_gst FLOAT,
  purchase_gst_percentage FLOAT DEFAULT 18,
  purchase_taxable_value FLOAT,
  purchase_igst FLOAT DEFAULT 0,
  purchase_cgst FLOAT,
  purchase_sgst FLOAT,
  total_purchase_cost FLOAT,
  mrp_incl_gst FLOAT,
  mrp_excl_gst FLOAT,
  discount_on_sales_percentage FLOAT DEFAULT 0,
  discounted_sales_rate_excl_gst FLOAT,
  sales_gst_percentage FLOAT DEFAULT 18,
  sales_taxable_value FLOAT,
  igst_rs FLOAT DEFAULT 0,
  cgst_rs FLOAT,
  sgst_rs FLOAT,
  invoice_value_rs FLOAT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table 3: Consumption (Auto-Fetched with POS Option)
CREATE TABLE IF NOT EXISTS inventory_consumption (
  consumption_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date TIMESTAMP NOT NULL DEFAULT NOW(),
  product_name TEXT NOT NULL,
  hsn_code TEXT,
  units TEXT,
  requisition_voucher_no TEXT,
  consumption_qty INTEGER NOT NULL,
  purchase_cost_per_unit_ex_gst FLOAT,
  purchase_gst_percentage FLOAT DEFAULT 18,
  purchase_taxable_value FLOAT,
  purchase_igst FLOAT DEFAULT 0,
  purchase_cgst FLOAT,
  purchase_sgst FLOAT,
  total_purchase_cost FLOAT,
  balance_qty INTEGER,
  taxable_value FLOAT,
  igst_rs FLOAT DEFAULT 0,
  cgst_rs FLOAT,
  sgst_rs FLOAT,
  invoice_value FLOAT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_purchases_date ON inventory_purchases(date);
CREATE INDEX IF NOT EXISTS idx_sales_invoice_no ON inventory_sales(invoice_no);
CREATE INDEX IF NOT EXISTS idx_consumption_voucher_no ON inventory_consumption(requisition_voucher_no);

-- Create a view for balance stock calculation
CREATE OR REPLACE VIEW inventory_balance_stock AS
SELECT
  p.product_name,
  p.hsn_code,
  p.units,
  SUM(p.purchase_qty) as total_purchases,
  COALESCE(SUM(s.sales_qty), 0) as total_sales,
  COALESCE(SUM(c.consumption_qty), 0) as total_consumption,
  SUM(p.purchase_qty) - COALESCE(SUM(s.sales_qty), 0) - COALESCE(SUM(c.consumption_qty), 0) as balance_qty,
  AVG(p.purchase_taxable_value / NULLIF(p.purchase_qty, 0)) as avg_purchase_cost_per_unit
FROM
  inventory_purchases p
LEFT JOIN
  inventory_sales s ON p.product_name = s.product_name
LEFT JOIN
  inventory_consumption c ON p.product_name = c.product_name
GROUP BY
  p.product_name, p.hsn_code, p.units; 