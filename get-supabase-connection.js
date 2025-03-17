// This script will help you get the correct Supabase connection information
// Run with: node get-supabase-connection.js

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get the current file path and directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-supabase-url.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

console.log('=== Supabase Connection Information ===');
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key:', supabaseAnonKey ? '****' + supabaseAnonKey.slice(-4) : 'Not set');

// Extract the project reference from the URL
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
console.log('Project Reference:', projectRef || 'Could not extract from URL');

if (projectRef) {
  console.log('\n=== MCP Configuration ===');
  console.log('Host:', `db.${projectRef}.supabase.co`);
  console.log('Port: 5432');
  console.log('User: postgres');
  console.log('Database: postgres');
  console.log('SSL: true');
  
  console.log('\n=== Instructions ===');
  console.log('1. Update your mcp.json file with the information above');
  console.log('2. Replace "your-database-password" with your actual database password');
  console.log('3. To get your database password:');
  console.log('   a. Go to your Supabase dashboard (https://app.supabase.com)');
  console.log('   b. Select your project');
  console.log('   c. Go to Project Settings > Database');
  console.log('   d. Look for "Database Password" or "Connection Info"');
  console.log('   e. You might need to reset your database password if you don\'t know it');
  
  console.log('\n=== Example mcp.json ===');
  console.log(`{
  "databases": [
    {
      "id": "supabase",
      "type": "postgres",
      "host": "db.${projectRef}.supabase.co",
      "port": 5432,
      "user": "postgres",
      "password": "your-database-password",
      "database": "postgres",
      "ssl": true
    }
  ]
}`);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

// Try to connect to Supabase
console.log('\n=== Testing Connection ===');
async function testConnection() {
  try {
    const { data, error } = await supabase.from('_fake_table_to_test_connection').select('*').limit(1);
    
    if (error) {
      if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
        console.log('✅ Successfully connected to Supabase API (table not found error is expected)');
      } else {
        console.error('❌ Connection error:', error);
        console.error('This might be an authentication issue. Check your credentials.');
      }
    } else {
      console.log('✅ Successfully connected to Supabase API');
    }
  } catch (e) {
    console.error('❌ Failed to connect to Supabase:', e);
    console.error('This might be a network or configuration issue.');
  }
}

testConnection()
  .catch(err => {
    console.error('Error in script:', err);
  }); 