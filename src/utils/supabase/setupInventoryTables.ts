import { supabase, TABLES } from './supabaseClient';
import { executeSql, ensureUuidExtension } from './directSqlExecution';

// SQL statements for creating inventory tables
const inventorySchema = `
-- Inventory Schema for R&G Salon

-- Table 1: Purchases (Manual Input)
CREATE TABLE IF NOT EXISTS ${TABLES.PURCHASES} (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  product_name TEXT NOT NULL,
  hsn_code TEXT NOT NULL,
  units TEXT NOT NULL,
  purchase_qty INTEGER NOT NULL,
  mrp_incl_gst DECIMAL(10, 2) NOT NULL,
  mrp_excl_gst DECIMAL(10, 2) NOT NULL,
  gst_percentage DECIMAL(5, 2) NOT NULL,
  purchase_taxable_value DECIMAL(10, 2) NOT NULL,
  purchase_igst DECIMAL(10, 2) NOT NULL,
  purchase_cgst DECIMAL(10, 2) NOT NULL,
  purchase_sgst DECIMAL(10, 2) NOT NULL,
  purchase_invoice_value_rs DECIMAL(10, 2) NOT NULL,
  discount_on_purchase_percentage DECIMAL(5, 2) NOT NULL,
  vendor_name TEXT NOT NULL,
  invoice_no TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 2: Sales (Auto-Fetched from POS)
CREATE TABLE IF NOT EXISTS ${TABLES.SALES} (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  product_name TEXT NOT NULL,
  hsn_code TEXT NOT NULL,
  units TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  mrp_incl_gst DECIMAL(10, 2) NOT NULL,
  mrp_excl_gst DECIMAL(10, 2) NOT NULL,
  discount_percentage DECIMAL(5, 2) NOT NULL,
  gst_percentage DECIMAL(5, 2) NOT NULL,
  taxable_value DECIMAL(10, 2) NOT NULL,
  igst DECIMAL(10, 2) NOT NULL,
  cgst DECIMAL(10, 2) NOT NULL,
  sgst DECIMAL(10, 2) NOT NULL,
  invoice_value DECIMAL(10, 2) NOT NULL,
  invoice_no TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 3: Consumption (Auto-Fetched with POS Option)
CREATE TABLE IF NOT EXISTS ${TABLES.CONSUMPTION} (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  product_name TEXT NOT NULL,
  hsn_code TEXT NOT NULL,
  units TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  mrp_incl_gst DECIMAL(10, 2) NOT NULL,
  mrp_excl_gst DECIMAL(10, 2) NOT NULL,
  gst_percentage DECIMAL(5, 2) NOT NULL,
  taxable_value DECIMAL(10, 2) NOT NULL,
  igst DECIMAL(10, 2) NOT NULL,
  cgst DECIMAL(10, 2) NOT NULL,
  sgst DECIMAL(10, 2) NOT NULL,
  invoice_value DECIMAL(10, 2) NOT NULL,
  purpose TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_purchases_date ON ${TABLES.PURCHASES}(date);
CREATE INDEX IF NOT EXISTS idx_sales_invoice_no ON ${TABLES.SALES}(invoice_no);
CREATE INDEX IF NOT EXISTS idx_consumption_voucher_no ON ${TABLES.CONSUMPTION}(purpose);

-- Create a view for balance stock calculation
CREATE OR REPLACE VIEW ${TABLES.BALANCE_STOCK} AS
WITH product_totals AS (
  SELECT 
    product_name,
    hsn_code,
    units,
    COALESCE(SUM(purchase_qty), 0) as total_purchases,
    0 as opening_stock
  FROM ${TABLES.PURCHASES}
  GROUP BY product_name, hsn_code, units
  
  UNION ALL
  
  SELECT 
    product_name,
    hsn_code,
    units,
    0 as total_purchases,
    0 as opening_stock
  FROM ${TABLES.SALES}
  GROUP BY product_name, hsn_code, units
  
  UNION ALL
  
  SELECT 
    product_name,
    hsn_code,
    units,
    0 as total_purchases,
    0 as opening_stock
  FROM ${TABLES.CONSUMPTION}
  GROUP BY product_name, hsn_code, units
),

aggregated_products AS (
  SELECT 
    product_name,
    hsn_code,
    units,
    MAX(opening_stock) as opening_stock,
    SUM(total_purchases) as purchases
  FROM product_totals
  GROUP BY product_name, hsn_code, units
),

sales_totals AS (
  SELECT
    product_name,
    hsn_code,
    units,
    COALESCE(SUM(quantity), 0) as sales
  FROM ${TABLES.SALES}
  GROUP BY product_name, hsn_code, units
),

consumption_totals AS (
  SELECT
    product_name,
    hsn_code,
    units,
    COALESCE(SUM(quantity), 0) as consumption
  FROM ${TABLES.CONSUMPTION}
  GROUP BY product_name, hsn_code, units
)

SELECT
  p.product_name,
  p.hsn_code,
  p.units,
  p.opening_stock,
  p.purchases,
  COALESCE(s.sales, 0) as sales,
  COALESCE(c.consumption, 0) as consumption,
  p.opening_stock + p.purchases - COALESCE(s.sales, 0) - COALESCE(c.consumption, 0) as closing_stock,
  NOW() as last_updated
FROM aggregated_products p
LEFT JOIN sales_totals s ON p.product_name = s.product_name AND p.hsn_code = s.hsn_code AND p.units = s.units
LEFT JOIN consumption_totals c ON p.product_name = c.product_name AND p.hsn_code = c.hsn_code AND p.units = c.units;
`;

/**
 * Creates the necessary tables for inventory management in Supabase
 * This should be run once to set up the database schema
 */
export const setupInventoryTables = async (): Promise<{ 
  success: boolean; 
  results: Record<string, boolean>;
  error?: string;
}> => {
  const results: Record<string, boolean> = {};
  
  try {
    // SQL to create the purchases table
    const purchasesTableSQL = `
      CREATE TABLE IF NOT EXISTS ${TABLES.PURCHASES} (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        date DATE NOT NULL,
        product_name TEXT NOT NULL,
        hsn_code TEXT NOT NULL,
        units TEXT NOT NULL,
        purchase_qty INTEGER NOT NULL,
        mrp_incl_gst DECIMAL(10, 2) NOT NULL,
        mrp_excl_gst DECIMAL(10, 2) NOT NULL,
        gst_percentage DECIMAL(5, 2) NOT NULL,
        purchase_taxable_value DECIMAL(10, 2) NOT NULL,
        purchase_igst DECIMAL(10, 2) NOT NULL,
        purchase_cgst DECIMAL(10, 2) NOT NULL,
        purchase_sgst DECIMAL(10, 2) NOT NULL,
        purchase_invoice_value_rs DECIMAL(10, 2) NOT NULL,
        discount_on_purchase_percentage DECIMAL(5, 2) NOT NULL,
        vendor_name TEXT NOT NULL,
        invoice_no TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    
    // SQL to create the sales table
    const salesTableSQL = `
      CREATE TABLE IF NOT EXISTS ${TABLES.SALES} (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        date DATE NOT NULL,
        product_name TEXT NOT NULL,
        hsn_code TEXT NOT NULL,
        units TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        mrp_incl_gst DECIMAL(10, 2) NOT NULL,
        mrp_excl_gst DECIMAL(10, 2) NOT NULL,
        discount_percentage DECIMAL(5, 2) NOT NULL,
        gst_percentage DECIMAL(5, 2) NOT NULL,
        taxable_value DECIMAL(10, 2) NOT NULL,
        igst DECIMAL(10, 2) NOT NULL,
        cgst DECIMAL(10, 2) NOT NULL,
        sgst DECIMAL(10, 2) NOT NULL,
        invoice_value DECIMAL(10, 2) NOT NULL,
        invoice_no TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    
    // SQL to create the consumption table
    const consumptionTableSQL = `
      CREATE TABLE IF NOT EXISTS ${TABLES.CONSUMPTION} (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        date DATE NOT NULL,
        product_name TEXT NOT NULL,
        hsn_code TEXT NOT NULL,
        units TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        mrp_incl_gst DECIMAL(10, 2) NOT NULL,
        mrp_excl_gst DECIMAL(10, 2) NOT NULL,
        gst_percentage DECIMAL(5, 2) NOT NULL,
        taxable_value DECIMAL(10, 2) NOT NULL,
        igst DECIMAL(10, 2) NOT NULL,
        cgst DECIMAL(10, 2) NOT NULL,
        sgst DECIMAL(10, 2) NOT NULL,
        invoice_value DECIMAL(10, 2) NOT NULL,
        purpose TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    
    // SQL to create the balance stock view
    const balanceStockViewSQL = `
      CREATE OR REPLACE VIEW ${TABLES.BALANCE_STOCK} AS
      WITH product_totals AS (
        SELECT 
          product_name,
          hsn_code,
          units,
          COALESCE(SUM(purchase_qty), 0) as total_purchases,
          0 as opening_stock
        FROM ${TABLES.PURCHASES}
        GROUP BY product_name, hsn_code, units
        
        UNION ALL
        
        SELECT 
          product_name,
          hsn_code,
          units,
          0 as total_purchases,
          0 as opening_stock
        FROM ${TABLES.SALES}
        GROUP BY product_name, hsn_code, units
        
        UNION ALL
        
        SELECT 
          product_name,
          hsn_code,
          units,
          0 as total_purchases,
          0 as opening_stock
        FROM ${TABLES.CONSUMPTION}
        GROUP BY product_name, hsn_code, units
      ),
      
      aggregated_products AS (
        SELECT 
          product_name,
          hsn_code,
          units,
          MAX(opening_stock) as opening_stock,
          SUM(total_purchases) as purchases
        FROM product_totals
        GROUP BY product_name, hsn_code, units
      ),
      
      sales_totals AS (
        SELECT
          product_name,
          hsn_code,
          units,
          COALESCE(SUM(quantity), 0) as sales
        FROM ${TABLES.SALES}
        GROUP BY product_name, hsn_code, units
      ),
      
      consumption_totals AS (
        SELECT
          product_name,
          hsn_code,
          units,
          COALESCE(SUM(quantity), 0) as consumption
        FROM ${TABLES.CONSUMPTION}
        GROUP BY product_name, hsn_code, units
      )
      
      SELECT 
        p.product_name,
        p.hsn_code,
        p.units,
        p.opening_stock,
        p.purchases,
        COALESCE(s.sales, 0) as sales,
        COALESCE(c.consumption, 0) as consumption,
        p.opening_stock + p.purchases - COALESCE(s.sales, 0) - COALESCE(c.consumption, 0) as closing_stock,
        NOW() as last_updated
      FROM aggregated_products p
      LEFT JOIN sales_totals s ON p.product_name = s.product_name AND p.hsn_code = s.hsn_code AND p.units = s.units
      LEFT JOIN consumption_totals c ON p.product_name = c.product_name AND p.hsn_code = c.hsn_code AND p.units = c.units;
    `;
    
    // Execute table creation SQL
    let { error: purchasesError } = await supabase.rpc('exec_sql', { query: purchasesTableSQL });
    results[TABLES.PURCHASES] = !purchasesError;
    
    if (purchasesError) {
      console.error('Error creating purchases table:', purchasesError);
        } else {
      console.log('Purchases table created or already exists');
    }
    
    let { error: salesError } = await supabase.rpc('exec_sql', { query: salesTableSQL });
    results[TABLES.SALES] = !salesError;
    
    if (salesError) {
      console.error('Error creating sales table:', salesError);
    } else {
      console.log('Sales table created or already exists');
    }
    
    let { error: consumptionError } = await supabase.rpc('exec_sql', { query: consumptionTableSQL });
    results[TABLES.CONSUMPTION] = !consumptionError;
    
    if (consumptionError) {
      console.error('Error creating consumption table:', consumptionError);
    } else {
      console.log('Consumption table created or already exists');
    }
    
    let { error: viewError } = await supabase.rpc('exec_sql', { query: balanceStockViewSQL });
    results[TABLES.BALANCE_STOCK] = !viewError;
    
    if (viewError) {
      console.error('Error creating balance stock view:', viewError);
    } else {
      console.log('Balance stock view created or replaced');
    }
    
    // Verify tables exist
    const allTablesCreated = Object.values(results).every(result => result);
    
    return {
      success: allTablesCreated,
      results
    };
  } catch (error) {
    console.error('Failed to set up inventory tables:', error);
    return {
      success: false,
      results,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Function to test if tables exist
export const checkInventoryTablesExist = async (): Promise<boolean> => {
  try {
    console.log('Checking if inventory tables exist...');
    
    // Try to query the purchases table
    const { data: purchasesData, error: purchasesError } = await supabase
      .from(TABLES.PURCHASES)
      .select('count(*)', { count: 'exact', head: true });
    
    console.log('Purchases table check:', { data: purchasesData, error: purchasesError });
    
    if (purchasesError) {
      console.error('Error checking inventory_purchases table:', purchasesError);
      return false;
    }
    
    // Also check the other tables
    const { error: salesError } = await supabase
      .from(TABLES.SALES)
      .select('count(*)', { count: 'exact', head: true });
      
    console.log('Sales table check:', { error: salesError });
    
    if (salesError) {
      console.error('Error checking inventory_sales table:', salesError);
      return false;
    }
    
    const { error: consumptionError } = await supabase
      .from(TABLES.CONSUMPTION)
      .select('count(*)', { count: 'exact', head: true });
      
    console.log('Consumption table check:', { error: consumptionError });
    
    if (consumptionError) {
      console.error('Error checking inventory_consumption table:', consumptionError);
      return false;
    }
    
    // Also check if the view exists by trying to query it
    try {
      const { error: viewError } = await supabase
        .from(TABLES.BALANCE_STOCK)
        .select('count(*)', { count: 'exact', head: true });
        
      console.log('Balance stock view check:', { error: viewError });
      
      if (viewError) {
        console.error('Error checking inventory_balance_stock view:', viewError);
        return false;
      }
    } catch (viewError) {
      console.error('Exception checking inventory_balance_stock view:', viewError);
      return false;
    }
    
    console.log('All inventory tables and views exist!');
    return true;
  } catch (error) {
    console.error('Failed to check if inventory tables exist:', error);
    return false;
  }
}; 