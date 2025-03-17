// This script will check tables using the Supabase API
// Run with: node check-tables-api.js

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://cpkxkoosykyahuezxela.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwa3hrb29zeWt5YWh1ZXp4ZWxhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTEwMTc2MDAsImV4cCI6MjAyNjU5MzYwMH0.Nh8HZ_0BQoaQSWHBkO-YjNoWNu-DPmhvnODm-FLTvLE';

console.log('=== Supabase API Check ===');
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key:', supabaseAnonKey ? '****' + supabaseAnonKey.slice(-4) : 'Not set');

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

// List of tables to check
const tablesToCheck = [
  'product_collections',
  'products',
  'inventory_purchases',
  'inventory_sales',
  'inventory_consumption',
  'inventory_balance_stock'
];

async function checkTables() {
  console.log('\nChecking tables using Supabase API...\n');
  
  // First check if we can connect to Supabase
  try {
    const { data, error } = await supabase.from('_fake_table_to_test_connection').select('*').limit(1);
    
    if (error) {
      if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
        console.log('✅ Successfully connected to Supabase API (table not found error is expected)\n');
      } else {
        console.error('❌ Connection error:', error);
        console.error('This might be an authentication issue. Check your credentials.\n');
        return;
      }
    } else {
      console.log('✅ Successfully connected to Supabase API\n');
    }
  } catch (e) {
    console.error('❌ Failed to connect to Supabase:', e);
    console.error('This might be a network or configuration issue.\n');
    return;
  }
  
  let tablesFound = 0;
  
  for (const table of tablesToCheck) {
    try {
      console.log(`Checking table: ${table}`);
      const { data, error } = await supabase
        .from(table)
        .select('count', { count: 'exact', head: true });
      
      if (error) {
        console.error(`❌ Error checking table ${table}:`, error.code, error.message);
        if (error.code === 'PGRST116') {
          console.log(`   Table '${table}' does not exist in the database.`);
        } else if (error.code === '42501') {
          console.log(`   Permission denied for table '${table}'. Check your RLS policies.`);
        } else if (error.code === 'PGRST301') {
          console.log(`   JWT authentication failed. Your token might be invalid or expired.`);
        }
      } else {
        tablesFound++;
        console.log(`✅ Table ${table} exists with count:`, data?.count || 0);
        
        // Get sample data
        const { data: sampleData, error: sampleError } = await supabase
          .from(table)
          .select('*')
          .limit(2);
        
        if (!sampleError && sampleData && sampleData.length > 0) {
          console.log(`   Sample data:`, JSON.stringify(sampleData[0], null, 2).substring(0, 200) + '...');
        } else if (sampleError) {
          console.log(`   Error fetching sample data:`, sampleError.message);
        } else {
          console.log(`   No data found in table.`);
        }
      }
    } catch (e) {
      console.error(`❌ Exception checking table ${table}:`, e.message);
    }
    console.log('-----------------------------------');
  }
  
  console.log(`\nSummary: Found ${tablesFound} out of ${tablesToCheck.length} tables.`);
  
  if (tablesFound === 0) {
    console.log('\nPossible issues:');
    console.log('1. Your Supabase credentials might be incorrect');
    console.log('2. The tables might not exist in your database');
    console.log('3. You might not have permission to access these tables');
    console.log('\nNext steps:');
    console.log('1. Check your Supabase URL and anon key in the .env file');
    console.log('2. Run the SQL script to create the tables');
    console.log('3. Check your RLS policies in the Supabase dashboard');
  }
}

// Run the check
checkTables()
  .catch(err => {
    console.error('Error in script:', err);
  }); 