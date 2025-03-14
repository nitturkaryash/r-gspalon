import { createClient } from '@supabase/supabase-js';

// Get environment variables for Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string || 'https://your-supabase-url.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string || 'your-anon-key';

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tables for inventory management
export const TABLES = {
  PURCHASES: 'inventory_purchases',
  SALES: 'inventory_sales',
  CONSUMPTION: 'inventory_consumption',
};

// Helper function to handle Supabase errors
export const handleSupabaseError = (error: any): Error => {
  console.error('Supabase error:', error);
  return new Error(error.message || 'An error occurred with the database operation');
}; 