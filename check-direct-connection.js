// This script will try to connect directly to your Supabase PostgreSQL database
// Run with: node check-direct-connection.js

import pg from 'pg';
const { Client } = pg;

// Connection details from mcp.json
const connectionConfig = {
  host: 'db.cpkxkoosykyahuezxela.supabase.co',
  port: 5432,
  user: 'postgres',
  password: 'qi2GegVUMboAPyRy',
  database: 'postgres',
  ssl: {
    rejectUnauthorized: false // For development only, consider setting to true in production
  }
};

console.log('Attempting to connect to Supabase PostgreSQL database...');
console.log('Connection details:');
console.log('- Host:', connectionConfig.host);
console.log('- Port:', connectionConfig.port);
console.log('- User:', connectionConfig.user);
console.log('- Database:', connectionConfig.database);
console.log('- SSL:', !!connectionConfig.ssl);

const client = new Client(connectionConfig);

async function checkConnection() {
  try {
    await client.connect();
    console.log('✅ Successfully connected to the database!');
    
    // Query to list all tables in the public schema
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    
    console.log('\nFetching tables in the public schema...');
    const tablesResult = await client.query(tablesQuery);
    
    if (tablesResult.rows.length === 0) {
      console.log('No tables found in the public schema.');
    } else {
      console.log(`Found ${tablesResult.rows.length} tables:`);
      tablesResult.rows.forEach((row, index) => {
        console.log(`${index + 1}. ${row.table_name}`);
      });
      
      // For each table, get the count of rows
      console.log('\nFetching row counts for each table...');
      for (const row of tablesResult.rows) {
        const tableName = row.table_name;
        try {
          const countResult = await client.query(`SELECT COUNT(*) FROM "${tableName}";`);
          console.log(`- ${tableName}: ${countResult.rows[0].count} rows`);
        } catch (err) {
          console.log(`- ${tableName}: Error getting count - ${err.message}`);
        }
      }
    }
  } catch (err) {
    console.error('❌ Failed to connect to the database:', err.message);
    if (err.message.includes('getaddrinfo ENOTFOUND')) {
      console.error('\nThis error suggests that the hostname could not be resolved.');
      console.error('Possible issues:');
      console.error('1. The hostname is incorrect');
      console.error('2. There might be network connectivity issues');
      console.error('3. DNS resolution might be failing');
      console.error('\nTry pinging the host to check if it\'s reachable:');
      console.error(`ping ${connectionConfig.host}`);
    } else if (err.message.includes('password authentication failed')) {
      console.error('\nThis error suggests that the password is incorrect.');
      console.error('Please check your database password in the Supabase dashboard:');
      console.error('1. Go to https://app.supabase.com');
      console.error('2. Select your project');
      console.error('3. Go to Project Settings > Database');
      console.error('4. Check or reset your database password');
    }
  } finally {
    await client.end();
  }
}

checkConnection().catch(console.error); 