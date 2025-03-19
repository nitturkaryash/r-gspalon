import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

// Load environment variables
dotenv.config();

// Read .env file directly to verify the content
console.log('Reading .env file...');
try {
  const envContent = fs.readFileSync('.env', 'utf8');
  console.log('ENV file content:');
  
  // Print each line, but mask the actual key value
  envContent.split('\n').forEach(line => {
    if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) {
      const keyLength = line.replace('VITE_SUPABASE_ANON_KEY=', '').trim().length;
      console.log(`VITE_SUPABASE_ANON_KEY=****[key length: ${keyLength}]****`);
    } else if (line.startsWith('VITE_SUPABASE_URL=')) {
      console.log(line);
    } else if (line.trim() !== '') {
      console.log(`${line.split('=')[0]}=[REDACTED]`);
    }
  });
} catch (err) {
  console.error('Error reading .env file:', err);
}

// Check environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('\nEnvironment variables:');
console.log('VITE_SUPABASE_URL:', supabaseUrl ? 'present' : 'missing');
console.log('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? `present (length: ${supabaseAnonKey.length})` : 'missing');

// Clean any potential whitespace
const cleanedSupabaseUrl = supabaseUrl ? supabaseUrl.trim() : '';
const cleanedSupabaseAnonKey = supabaseAnonKey ? supabaseAnonKey.trim() : '';

// Validation
if (!cleanedSupabaseUrl || !cleanedSupabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

// Test Supabase connection
async function testConnection() {
  console.log('\nAttempting to connect to Supabase...');
  
  try {
    // Create Supabase client
    const supabase = createClient(cleanedSupabaseUrl, cleanedSupabaseAnonKey);
    
    // First, just try to see if the client initializes correctly
    console.log('Testing basic client initialization...');
    const { data: healthData } = await supabase.from('inventory_purchases').select('*').limit(1);
    console.log('Basic connection test result:', healthData ? 'Success' : 'No data returned');
    
    // If we got here without errors, the JWT is valid
    console.log('JWT validation passed - no parsing errors detected');
    
    return true;
  } catch (error) {
    console.error('Unexpected error connecting to Supabase:', error);
    
    // Special handling for JWSError/JWT errors
    if (error.message && (
      error.message.includes('JWSError') || 
      error.message.includes('JWT') ||
      error.message.includes('CompactDecodeError')
    )) {
      console.error('\nJWT ERROR DETECTED: The Supabase anon key appears to be invalid or malformed.');
      console.error('Please check for:');
      console.error('1. Extra whitespace or line breaks in your .env file');
      console.error('2. Ensure the key is exactly as provided in the Supabase dashboard');
      console.error('3. Create a new anon key in Supabase if needed\n');
      
      // Try to manually validate the JWT structure
      const parts = cleanedSupabaseAnonKey.split('.');
      console.error(`JWT parts count: ${parts.length} (should be 3)`);
      if (parts.length !== 3) {
        console.error('Invalid JWT format: A valid JWT should have 3 parts separated by periods.');
        console.error('Your JWT appears to have', parts.length, 'parts');
        
        // Try to fix the key by removing any potential line breaks or whitespace
        const fixedKey = cleanedSupabaseAnonKey.replace(/\s+/g, '');
        const fixedParts = fixedKey.split('.');
        console.error(`After cleaning: JWT parts count: ${fixedParts.length}`);
        
        if (fixedParts.length === 3) {
          console.error('The fixed key might work. Please update your .env file with this key (without extra spaces or line breaks).');
        }
      }
    }
    
    return false;
  }
}

// Run the test
testConnection().then(success => {
  if (success) {
    console.log('✅ Supabase connection test passed!');
  } else {
    console.error('❌ Supabase connection test failed');
  }
}); 