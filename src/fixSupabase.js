import fs from 'fs';
import path from 'path';

// Function to fix the JWT token in the .env file
async function fixJwtToken() {
  try {
    console.log('Reading .env file to fix JWT token format...');
    
    // Read the .env file
    const envPath = path.resolve('.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    // Split into lines
    const lines = envContent.split('\n');
    let fixedContent = '';
    let fixedAnything = false;
    
    // Process each line
    for (const line of lines) {
      if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) {
        // Extract the key
        let key = line.replace('VITE_SUPABASE_ANON_KEY=', '').trim();
        console.log(`Original key length: ${key.length}`);
        
        // Check if it's properly formatted (should have 3 parts separated by periods)
        const parts = key.split('.');
        console.log(`Key has ${parts.length} parts (should be 3)`);
        
        if (parts.length !== 3) {
          console.log('🔴 Invalid JWT format detected. Attempting to fix...');
          
          // Try to fix common issues:
          // 1. Remove all whitespace, quotes, and line breaks
          const cleanedKey = key.replace(/[\s\n\r"'`]/g, '');
          const cleanedParts = cleanedKey.split('.');
          
          if (cleanedParts.length === 3) {
            console.log('✅ Successfully fixed JWT format by cleaning whitespace and quotes');
            key = cleanedKey;
            fixedAnything = true;
          } else {
            // The standard Supabase key format
            console.log('⚠️ Unable to automatically fix the key. Setting a placeholder for testing.');
            // This is just a placeholder - you'll need to get the real key from Supabase
            key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwa3hrb29zeWt5YWh1ZXp4ZWxhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAxMzQ0NzcsImV4cCI6MjA1NTcxMDQ3N30.R0MaAaqVFMLObwnMVz-eghsKb_HYDWhCOAeFrQcw8e0';
            fixedAnything = true;
          }
        } else {
          console.log('✅ JWT format appears correct (has 3 parts)');
        }
        
        // Add the fixed line
        fixedContent += `VITE_SUPABASE_ANON_KEY=${key}\n`;
      } else {
        // Keep other lines unchanged
        fixedContent += line + '\n';
      }
    }
    
    // Only write back if we made changes
    if (fixedAnything) {
      console.log('Writing fixed .env file...');
      fs.writeFileSync(envPath, fixedContent.trim());
      console.log('✅ .env file updated successfully');
    } else {
      console.log('No changes needed to .env file');
    }
    
    console.log('\nNext steps:');
    console.log('1. Restart your development server');
    console.log('2. If still seeing JWT errors, check your Supabase project settings and get a fresh anon key');
    
    return fixedAnything;
  } catch (error) {
    console.error('Error fixing JWT token:', error);
    return false;
  }
}

// Run the fix function
fixJwtToken().then(fixed => {
  if (fixed) {
    console.log('JWT token fix attempted. Please restart your application.');
  } else {
    console.log('No JWT token fixes were applied.');
  }
}); 