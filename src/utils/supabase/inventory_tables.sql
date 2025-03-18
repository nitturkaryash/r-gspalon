-- Inventory Schema for R&G Salon
-- Run this script in the Supabase SQL Editor if the setup utility doesn't work

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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

-- Check if tables already exist to avoid errors on re-running
DO $$
BEGIN
    -- Create the purchases table if it doesn't exist
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'inventory_purchases') THEN
        CREATE TABLE public.inventory_purchases (
            purchase_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            product_name TEXT NOT NULL,
            hsn_code TEXT,
            units TEXT,
            date DATE DEFAULT CURRENT_DATE,
            purchase_invoice_number TEXT,
            purchase_qty NUMERIC NOT NULL,
            mrp_incl_gst NUMERIC,
            mrp_excl_gst NUMERIC,
            discount_on_purchase_percentage NUMERIC DEFAULT 0,
            gst_percentage NUMERIC DEFAULT 0,
            purchase_taxable_value NUMERIC,
            purchase_igst NUMERIC DEFAULT 0,
            purchase_cgst NUMERIC DEFAULT 0,
            purchase_sgst NUMERIC DEFAULT 0,
            purchase_invoice_value_rs NUMERIC,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
    END IF;

    -- Create the products table if it doesn't exist
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'inventory_products') THEN
        CREATE TABLE public.inventory_products (
            product_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            product_name TEXT NOT NULL,
            hsn_code TEXT,
            units TEXT,
            mrp_incl_gst NUMERIC NOT NULL,
            mrp_excl_gst NUMERIC,
            stock_quantity NUMERIC DEFAULT 0,
            gst_percentage NUMERIC DEFAULT 0,
            status TEXT DEFAULT 'active',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
    END IF;

    -- Create the sales table if it doesn't exist
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'inventory_sales') THEN
        CREATE TABLE public.inventory_sales (
            sale_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            product_name TEXT NOT NULL,
            hsn_code TEXT,
            units TEXT,
            date DATE DEFAULT CURRENT_DATE,
            invoice_no TEXT,
            sales_qty NUMERIC NOT NULL,
            purchase_cost_per_unit_ex_gst NUMERIC,
            purchase_gst_percentage NUMERIC DEFAULT 0,
            purchase_taxable_value NUMERIC,
            purchase_cgst NUMERIC DEFAULT 0,
            purchase_sgst NUMERIC DEFAULT 0,
            total_purchase_cost NUMERIC,
            mrp_incl_gst NUMERIC,
            mrp_excl_gst NUMERIC,
            discount_on_sales_percentage NUMERIC DEFAULT 0,
            discounted_sales_rate_excl_gst NUMERIC,
            sales_gst_percentage NUMERIC DEFAULT 0,
            sales_taxable_value NUMERIC,
            igst_rs NUMERIC DEFAULT 0,
            cgst_rs NUMERIC DEFAULT 0,
            sgst_rs NUMERIC DEFAULT 0,
            invoice_value_rs NUMERIC,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
    END IF;

    -- Create the consumption table if it doesn't exist
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'inventory_consumption') THEN
        CREATE TABLE public.inventory_consumption (
            consumption_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            product_name TEXT NOT NULL,
            hsn_code TEXT,
            units TEXT,
            date DATE DEFAULT CURRENT_DATE,
            requisition_voucher_no TEXT,
            consumption_qty NUMERIC NOT NULL,
            purchase_cost_per_unit_ex_gst NUMERIC,
            purchase_gst_percentage NUMERIC DEFAULT 0,
            purchase_taxable_value NUMERIC,
            purchase_cgst NUMERIC DEFAULT 0,
            purchase_sgst NUMERIC DEFAULT 0,
            total_purchase_cost NUMERIC,
            balance_qty NUMERIC,
            taxable_value NUMERIC,
            cgst_rs NUMERIC DEFAULT 0,
            sgst_rs NUMERIC DEFAULT 0,
            invoice_value NUMERIC,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
    END IF;

    -- Create a view for balance stock calculation
    DROP VIEW IF EXISTS inventory_balance_stock;
    CREATE VIEW inventory_balance_stock AS
    WITH product_totals AS (
        SELECT 
            product_name,
            hsn_code,
            units,
            COALESCE(SUM(purchase_qty), 0) as total_purchases,
            0 as total_sales,
            0 as total_consumption,
            COALESCE(SUM(purchase_taxable_value), 0) as total_purchase_value
        FROM inventory_purchases
        GROUP BY product_name, hsn_code, units
        
        UNION ALL
        
        SELECT 
            product_name,
            hsn_code,
            units,
            0 as total_purchases,
            COALESCE(SUM(sales_qty), 0) as total_sales,
            0 as total_consumption,
            0 as total_purchase_value
        FROM inventory_sales
        GROUP BY product_name, hsn_code, units
        
        UNION ALL
        
        SELECT 
            product_name,
            hsn_code,
            units,
            0 as total_purchases,
            0 as total_sales,
            COALESCE(SUM(consumption_qty), 0) as total_consumption,
            0 as total_purchase_value
        FROM inventory_consumption
        GROUP BY product_name, hsn_code, units
    )
    SELECT 
        product_name,
        MAX(hsn_code) as hsn_code,
        MAX(units) as units,
        SUM(total_purchases) as total_purchases,
        SUM(total_sales) as total_sales,
        SUM(total_consumption) as total_consumption,
        SUM(total_purchases) - SUM(total_sales) - SUM(total_consumption) as balance_qty,
        CASE 
            WHEN SUM(total_purchases) > 0 THEN SUM(total_purchase_value) / SUM(total_purchases)
            ELSE 0
        END as avg_purchase_cost_per_unit
    FROM product_totals
    GROUP BY product_name;

    -- Create a trigger to update inventory_products stock on purchases
    CREATE OR REPLACE FUNCTION update_product_stock_on_purchase()
    RETURNS TRIGGER AS $$
    BEGIN
        -- Check if product exists in inventory_products
        IF EXISTS (SELECT 1 FROM inventory_products WHERE product_name = NEW.product_name) THEN
            -- Update existing product
            UPDATE inventory_products
            SET 
                stock_quantity = stock_quantity + NEW.purchase_qty,
                mrp_incl_gst = NEW.mrp_incl_gst,
                mrp_excl_gst = NEW.mrp_excl_gst,
                gst_percentage = NEW.gst_percentage,
                updated_at = now()
            WHERE product_name = NEW.product_name;
        ELSE
            -- Insert new product
            INSERT INTO inventory_products (
                product_name, 
                hsn_code, 
                units, 
                mrp_incl_gst, 
                mrp_excl_gst, 
                stock_quantity, 
                gst_percentage
            ) VALUES (
                NEW.product_name,
                NEW.hsn_code,
                NEW.units,
                NEW.mrp_incl_gst,
                NEW.mrp_excl_gst,
                NEW.purchase_qty,
                NEW.gst_percentage
            );
        END IF;
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    -- Drop the trigger if it exists
    DROP TRIGGER IF EXISTS update_product_on_purchase ON inventory_purchases;

    -- Create the trigger
    CREATE TRIGGER update_product_on_purchase
    AFTER INSERT ON inventory_purchases
    FOR EACH ROW
    EXECUTE FUNCTION update_product_stock_on_purchase();

    -- Create a trigger to update inventory_products stock on sales
    CREATE OR REPLACE FUNCTION update_product_stock_on_sale()
    RETURNS TRIGGER AS $$
    BEGIN
        -- Update product stock
        UPDATE inventory_products
        SET 
            stock_quantity = stock_quantity - NEW.sales_qty,
            updated_at = now()
        WHERE product_name = NEW.product_name;
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    -- Drop the trigger if it exists
    DROP TRIGGER IF EXISTS update_product_on_sale ON inventory_sales;

    -- Create the trigger
    CREATE TRIGGER update_product_on_sale
    AFTER INSERT ON inventory_sales
    FOR EACH ROW
    EXECUTE FUNCTION update_product_stock_on_sale();

    -- Create a trigger to update inventory_products stock on consumption
    CREATE OR REPLACE FUNCTION update_product_stock_on_consumption()
    RETURNS TRIGGER AS $$
    BEGIN
        -- Update product stock
        UPDATE inventory_products
        SET 
            stock_quantity = stock_quantity - NEW.consumption_qty,
            updated_at = now()
        WHERE product_name = NEW.product_name;
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    -- Drop the trigger if it exists
    DROP TRIGGER IF EXISTS update_product_on_consumption ON inventory_consumption;

    -- Create the trigger
    CREATE TRIGGER update_product_on_consumption
    AFTER INSERT ON inventory_consumption
    FOR EACH ROW
    EXECUTE FUNCTION update_product_stock_on_consumption();

END
$$; 