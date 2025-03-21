import { supabase } from './supabaseClient';
import { executeSql, ensureUuidExtension } from './directSqlExecution';
// SQL statements for creating inventory tables
const inventorySchema = `
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
`;
/**
 * Runs the SQL commands to set up inventory tables in Supabase
 * This can be run from a development environment or admin panel
 */
export const setupInventoryTables = async () => {
    try {
        console.log('Setting up inventory tables...');
        // First ensure the UUID extension is available
        try {
            await ensureUuidExtension();
        }
        catch (uuidError) {
            console.error('Failed to ensure UUID extension:', uuidError);
            throw new Error(`Failed to set up UUID extension: ${uuidError instanceof Error ? uuidError.message : 'Unknown error'}`);
        }
        // Split the SQL file into individual statements and execute them
        const statements = inventorySchema
            .split(';')
            .map(statement => statement.trim())
            .filter(statement => statement.length > 0);
        console.log(`Found ${statements.length} SQL statements to execute`);
        const errors = [];
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            console.log(`Executing statement ${i + 1}/${statements.length}: ${statement.substring(0, 50)}...`);
            try {
                const result = await executeSql(statement);
                if (!result.success) {
                    const errorMsg = `Error executing SQL statement ${i + 1}: ${result.error?.message || 'Unknown error'}`;
                    console.error(errorMsg);
                    console.error('Statement:', statement);
                    // For critical statements (table creation), we should throw an error
                    if (statement.toLowerCase().includes('create table')) {
                        throw new Error(errorMsg);
                    }
                    // For non-critical statements (indexes, views), we'll collect errors but continue
                    errors.push({
                        statement: i + 1,
                        sql: statement,
                        error: result.error
                    });
                }
                else {
                    console.log(`Successfully executed statement ${i + 1}`);
                }
            }
            catch (statementError) {
                const errorMsg = `Error executing statement ${i + 1}: ${statementError instanceof Error ? statementError.message : 'Unknown error'}`;
                console.error(errorMsg);
                // For critical statements (table creation), we should throw an error
                if (statement.toLowerCase().includes('create table')) {
                    throw new Error(errorMsg);
                }
                // For non-critical statements (indexes, views), we'll collect errors but continue
                errors.push({
                    statement: i + 1,
                    sql: statement,
                    error: statementError
                });
            }
        }
        // If we have non-critical errors, log them but don't fail the entire process
        if (errors.length > 0) {
            console.warn(`Completed with ${errors.length} non-critical errors:`, errors);
        }
        else {
            console.log('Inventory tables setup complete without errors!');
        }
        // Verify tables were created
        try {
            const tablesExist = await checkInventoryTablesExist();
            console.log('Tables verification result:', tablesExist);
            if (!tablesExist) {
                throw new Error('Tables were not created successfully. Please check the Supabase logs for more details.');
            }
        }
        catch (verificationError) {
            console.error('Failed to verify tables:', verificationError);
            throw new Error(`Tables may have been created but verification failed: ${verificationError instanceof Error ? verificationError.message : 'Unknown error'}`);
        }
    }
    catch (error) {
        console.error('Failed to set up inventory tables:', error);
        throw error;
    }
};
// Function to test if tables exist
export const checkInventoryTablesExist = async () => {
    try {
        console.log('Checking if inventory tables exist...');
        // Try to query the purchases table
        const { data: purchasesData, error: purchasesError } = await supabase
            .from('inventory_purchases')
            .select('count(*)', { count: 'exact', head: true });
        console.log('Purchases table check:', { data: purchasesData, error: purchasesError });
        if (purchasesError) {
            console.error('Error checking inventory_purchases table:', purchasesError);
            return false;
        }
        // Also check the other tables
        const { error: salesError } = await supabase
            .from('inventory_sales')
            .select('count(*)', { count: 'exact', head: true });
        console.log('Sales table check:', { error: salesError });
        if (salesError) {
            console.error('Error checking inventory_sales table:', salesError);
            return false;
        }
        const { error: consumptionError } = await supabase
            .from('inventory_consumption')
            .select('count(*)', { count: 'exact', head: true });
        console.log('Consumption table check:', { error: consumptionError });
        if (consumptionError) {
            console.error('Error checking inventory_consumption table:', consumptionError);
            return false;
        }
        // Also check if the view exists by trying to query it
        try {
            const { error: viewError } = await supabase
                .from('inventory_balance_stock')
                .select('count(*)', { count: 'exact', head: true });
            console.log('Balance stock view check:', { error: viewError });
            if (viewError) {
                console.error('Error checking inventory_balance_stock view:', viewError);
                return false;
            }
        }
        catch (viewError) {
            console.error('Exception checking inventory_balance_stock view:', viewError);
            return false;
        }
        console.log('All inventory tables and views exist!');
        return true;
    }
    catch (error) {
        console.error('Failed to check if inventory tables exist:', error);
        return false;
    }
};
