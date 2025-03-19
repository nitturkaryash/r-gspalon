import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

// Load environment variables
dotenv.config();

// Helper to clean environment variables
function cleanEnvVar(value) {
  return value ? value.toString().trim().replace(/[\s\n\r"'`]/g, '') : '';
}

// Required tables based on code analysis
const REQUIRED_TABLES = [
  'inventory_purchases',
  'inventory_sales',
  'inventory_consumption',
  'inventory_balance_stock'
];

// Function to check database tables
async function checkDatabaseTables() {
  try {
    console.log('Checking Supabase database tables...\n');
    
    // Read and clean environment variables
    const supabaseUrl = cleanEnvVar(process.env.VITE_SUPABASE_URL);
    const supabaseKey = cleanEnvVar(process.env.VITE_SUPABASE_ANON_KEY);
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing Supabase credentials in .env file');
      return false;
    }
    
    console.log(`Supabase URL: ${supabaseUrl}`);
    console.log(`Supabase key format: ${supabaseKey.split('.').length === 3 ? 'Valid (3 parts)' : 'Invalid'}`);
    
    // Create Supabase client
    console.log('\nConnecting to Supabase...');
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Function to check if a table exists and get row count
    async function checkTable(tableName) {
      try {
        // First test with a count query
        const { count, error: countError } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });
        
        if (countError) {
          if (countError.code === 'PGRST104') {
            return { exists: false, message: 'Table does not exist', count: 0 };
          }
          return { exists: false, message: countError.message, count: 0 };
        }
        
        return { exists: true, message: 'Table exists', count };
      } catch (e) {
        return { exists: false, message: e.message, count: 0 };
      }
    }
    
    // Check each required table
    console.log('\nChecking required tables:');
    let allTablesExist = true;
    const tableStatus = [];
    
    for (const table of REQUIRED_TABLES) {
      const result = await checkTable(table);
      tableStatus.push({ table, ...result });
      
      if (!result.exists) {
        allTablesExist = false;
      }
      
      console.log(`- ${table}: ${result.exists ? '✅ Exists' : '❌ Missing'} ${result.exists ? `(${result.count} rows)` : `- ${result.message}`}`);
    }
    
    // Suggest schema creation if tables are missing
    if (!allTablesExist) {
      console.log('\n❌ Some required tables are missing. You may need to create the database schema.');
      console.log('\nHere is the SQL to create the missing tables:');
      
      for (const { table, exists } of tableStatus) {
        if (!exists) {
          let createTableSQL = '';
          
          switch (table) {
            case 'inventory_purchases':
              createTableSQL = `
CREATE TABLE inventory_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  purchase_invoice_number TEXT,
  product_name TEXT NOT NULL,
  hsn_code TEXT,
  units TEXT,
  purchase_qty NUMERIC NOT NULL,
  mrp_incl_gst NUMERIC NOT NULL,
  mrp_excl_gst NUMERIC NOT NULL,
  discount_on_purchase_percentage NUMERIC DEFAULT 0,
  gst_percentage NUMERIC NOT NULL,
  purchase_taxable_value NUMERIC NOT NULL,
  purchase_igst NUMERIC DEFAULT 0,
  purchase_cgst NUMERIC DEFAULT 0,
  purchase_sgst NUMERIC DEFAULT 0,
  purchase_invoice_value_rs NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
              `;
              break;
              
            case 'inventory_sales':
              createTableSQL = `
CREATE TABLE inventory_sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  invoice_no TEXT,
  product_name TEXT NOT NULL,
  hsn_code TEXT,
  units TEXT,
  sales_qty NUMERIC NOT NULL,
  mrp_incl_gst NUMERIC NOT NULL,
  mrp_excl_gst NUMERIC NOT NULL,
  discount_on_sales_percentage NUMERIC DEFAULT 0,
  discounted_sales_rate_excl_gst NUMERIC,
  gst_percentage NUMERIC NOT NULL,
  taxable_value NUMERIC NOT NULL,
  igst NUMERIC DEFAULT 0,
  cgst NUMERIC DEFAULT 0,
  sgst NUMERIC DEFAULT 0,
  invoice_value NUMERIC NOT NULL,
  purchase_cost_per_unit_ex_gst NUMERIC,
  purchase_gst_percentage NUMERIC,
  purchase_taxable_value NUMERIC,
  purchase_igst NUMERIC DEFAULT 0,
  purchase_cgst NUMERIC DEFAULT 0,
  purchase_sgst NUMERIC DEFAULT 0,
  total_purchase_cost NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
              `;
              break;
              
            case 'inventory_consumption':
              createTableSQL = `
CREATE TABLE inventory_consumption (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  requisition_voucher_no TEXT,
  product_name TEXT NOT NULL,
  hsn_code TEXT,
  units TEXT,
  consumption_qty NUMERIC NOT NULL,
  purchase_cost_per_unit_ex_gst NUMERIC,
  purchase_gst_percentage NUMERIC,
  purchase_taxable_value NUMERIC,
  igst NUMERIC DEFAULT 0,
  cgst NUMERIC DEFAULT 0,
  sgst NUMERIC DEFAULT 0,
  taxable_value NUMERIC,
  invoice_value NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
              `;
              break;
              
            case 'inventory_balance_stock':
              createTableSQL = `
CREATE TABLE inventory_balance_stock (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_name TEXT NOT NULL,
  hsn_code TEXT,
  unit TEXT,
  balance_qty NUMERIC NOT NULL,
  balance_value NUMERIC NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
              `;
              break;
          }
          
          console.log(createTableSQL);
        }
      }
      
      console.log('\nYou can run these SQL statements in the Supabase SQL editor to create the missing tables.');
    } else {
      console.log('\n✅ All required tables exist in the database.');
    }
    
    return true;
  } catch (error) {
    console.error('Error checking database tables:', error);
    return false;
  }
}

// Run the check function
checkDatabaseTables().then(success => {
  if (success) {
    console.log('\nDatabase check completed.');
  } else {
    console.log('\nDatabase check failed.');
  }
}); 