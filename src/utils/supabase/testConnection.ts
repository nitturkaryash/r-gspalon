import { supabase, TABLES } from './supabaseClient';

// Function to test Supabase connection
export const testSupabaseConnection = async () => {
  try {
    console.log('Testing Supabase connection...');
    
    // First, test the connection by doing a simple query
    const { data, error } = await supabase
      .from(TABLES.PURCHASES)
      .select('count(*)')
      .limit(1);
    
    if (error) {
      console.error('Supabase connection test failed:', error);
      return { success: false, error };
    }
    
    console.log('Supabase connection test successful!', data);
    return { success: true, data };
  } catch (error) {
    console.error('Unexpected error during Supabase connection test:', error);
    return { success: false, error };
  }
};

// Execute the test
testSupabaseConnection().then(result => {
  if (result.success) {
    console.log('✅ Supabase connection is working properly');
  } else {
    console.error('❌ Supabase connection failed. Please check your credentials and network settings.');
  }
}); 