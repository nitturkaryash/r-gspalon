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

// Helper function to check if user is authenticated
export const checkAuthentication = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error) {
    console.error('Authentication error:', error);
    throw new Error(`Authentication error: ${error.message}`);
  }
  
  if (!user) {
    throw new Error('User is not authenticated. Please log in again.');
  }
  
  return user;
}; 