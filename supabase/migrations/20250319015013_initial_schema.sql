-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- *** INVENTORY MANAGEMENT SCHEMA ***

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

-- Table 4: Products
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  stock_quantity INTEGER DEFAULT 0,
  category TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_purchases_date ON inventory_purchases(date);
CREATE INDEX IF NOT EXISTS idx_sales_invoice_no ON inventory_sales(invoice_no);
CREATE INDEX IF NOT EXISTS idx_consumption_voucher_no ON inventory_consumption(requisition_voucher_no);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);

-- *** SALON MANAGEMENT SCHEMA ***

-- Table 5: Clients
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 6: Stylists
CREATE TABLE IF NOT EXISTS stylists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 7: Services
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  duration INTEGER NOT NULL, -- Duration in minutes
  category TEXT,
  type TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 8: Appointments
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id),
  stylist_id UUID REFERENCES stylists(id),
  service_id UUID REFERENCES services(id),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'scheduled',
  notes TEXT,
  paid BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 9: Appointment Stylists (for appointments with multiple stylists)
CREATE TABLE IF NOT EXISTS appointment_stylists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID REFERENCES appointments(id),
  stylist_id UUID REFERENCES stylists(id),
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 10: Breaks for stylists
CREATE TABLE IF NOT EXISTS breaks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stylist_id UUID REFERENCES stylists(id),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 11: Transactions
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id),
  stylist_id UUID REFERENCES stylists(id),
  appointment_id UUID REFERENCES appointments(id),
  total NUMERIC NOT NULL,
  subtotal NUMERIC NOT NULL,
  tax NUMERIC DEFAULT 0,
  discount NUMERIC DEFAULT 0,
  payment_method TEXT,
  payment_status TEXT DEFAULT 'completed',
  items JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 12: Product Collections (for grouping products)
CREATE TABLE IF NOT EXISTS product_collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- *** AUTHENTICATION & ADMIN ***

-- Table 13: Auth
CREATE TABLE IF NOT EXISTS auth (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  role VARCHAR(50) DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE
);

-- Table 14: Admin Users
CREATE TABLE IF NOT EXISTS admin_users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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

-- Create RPC function for checking admin login
CREATE OR REPLACE FUNCTION check_admin_login(email_input TEXT, password_input TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE email = email_input 
    AND password = password_input
    AND is_active = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
