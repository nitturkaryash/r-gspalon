// fix-supabase-token.js
// Run this script with: node fix-supabase-token.js

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Utility to validate JWT format
function validateJWT(token) {
  if (!token) return { valid: false, message: 'Token is empty' };
  
  const parts = token.split('.');
  if (parts.length !== 3) {
    return { 
      valid: false, 
      message: `Invalid JWT format: expected 3 parts, got ${parts.length}`
    };
  }
  
  return { valid: true, message: 'Token format is valid' };
}

// Clean token by removing whitespace, quotes, line breaks
function cleanToken(token) {
  return token.replace(/[\s\n\r"'`]/g, '');
}

// Main function to fix the Supabase token
async function fixSupabaseToken() {
  try {
    console.log('Supabase Token Fixer Utility');
    console.log('----------------------------');
    
    // Check if .env file exists
    const envPath = path.resolve('.env');
    if (!fs.existsSync(envPath)) {
      console.error(`Error: .env file not found at ${envPath}`);
      return false;
    }
    
    // Read the .env file
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    
    // Find and extract the Supabase token
    let supabaseTokenLine = '';
    let tokenLineIndex = -1;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('VITE_SUPABASE_ANON_KEY=')) {
        supabaseTokenLine = lines[i];
        tokenLineIndex = i;
        break;
      }
    }
    
    if (tokenLineIndex === -1) {
      console.error('Error: VITE_SUPABASE_ANON_KEY not found in .env file');
      return false;
    }
    
    // Extract the token
    let token = supabaseTokenLine.replace('VITE_SUPABASE_ANON_KEY=', '').trim();
    console.log(`\nFound token (length: ${token.length})`);
    
    // Validate the token
    const validationResult = validateJWT(token);
    console.log(`Token validation: ${validationResult.message}`);
    
    if (!validationResult.valid) {
      // Token is invalid, try to clean it
      const cleanedToken = cleanToken(token);
      console.log(`\nCleaned token (length: ${cleanedToken.length})`);
      
      const cleanedValidation = validateJWT(cleanedToken);
      console.log(`Cleaned token validation: ${cleanedValidation.message}`);
      
      if (cleanedValidation.valid) {
        // The cleaned token is valid, ask user if they want to update
        console.log('\nFound issues with your Supabase token format, but a cleaned version is valid.');
        const answer = await askQuestion('Do you want to update your .env file with the cleaned token? (y/n): ');
        
        if (answer.toLowerCase() === 'y') {
          // Update the token in the .env file
          lines[tokenLineIndex] = `VITE_SUPABASE_ANON_KEY=${cleanedToken}`;
          fs.writeFileSync(envPath, lines.join('\n'));
          console.log('\n✅ Success: Token updated in .env file');
          return true;
        } else {
          console.log('\nNo changes made.');
          return false;
        }
      } else {
        // Even cleaned token is invalid
        console.log('\nERROR: Token format is invalid even after cleaning.');
        console.log('Please regenerate a new anon key from your Supabase dashboard and update your .env file manually.');
        return false;
      }
    } else {
      console.log('\n✅ Your Supabase token format is valid. No changes needed.');
      return true;
    }
  } catch (error) {
    console.error('Error fixing Supabase token:', error);
    return false;
  }
}

// Helper to ask a question in the terminal
function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => {
    rl.question(query, answer => {
      rl.close();
      resolve(answer);
    });
  });
}

// Run the fix function
fixSupabaseToken().then(success => {
  if (success) {
    console.log('\nProcess completed. Try restarting your application now.');
  } else {
    console.log('\nFailed to fix the token. Please check your .env file manually.');
  }
}); 