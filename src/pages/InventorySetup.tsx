import React, { useState } from 'react';
import { Box, Button, Typography, Paper, CircularProgress, Alert, Divider, Link, Grid } from '@mui/material';
import { Container } from '@mui/material';
import { setupInventoryTables, checkInventoryTablesExist } from '../utils/supabase/setupInventoryTables';
import { testInventoryTables, insertTestPurchase, checkTableData } from '../utils/supabase/testTables';
import sqlScript from '../utils/supabase/inventory_tables.sql?raw';
import { toast } from 'react-toastify';
import { debugSupabase } from '../utils/supabase/debugSupabase';

const InventorySetup: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [tablesExist, setTablesExist] = useState<boolean | null>(null);
  const [showSql, setShowSql] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [isTestingTables, setIsTestingTables] = useState(false);
  const [isInsertingTestData, setIsInsertingTestData] = useState(false);
  const [tableData, setTableData] = useState<any>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isDebugging, setIsDebugging] = useState(false);

  const handleSetupTables = async () => {
    setIsLoading(true);
    setStatus('idle');
    setMessage('');
    
    try {
      await setupInventoryTables();
      setStatus('success');
      setMessage('Inventory tables have been successfully set up in Supabase.');
      toast.success('Inventory tables created successfully!');
      checkIfTablesExist();
    } catch (error) {
      console.error('Error setting up inventory tables:', error);
      setStatus('error');
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setMessage(errorMessage);
      toast.error(`Failed to set up inventory tables: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const checkIfTablesExist = async () => {
    try {
      const exists = await checkInventoryTablesExist();
      console.log('Inventory tables exist:', exists);
      setTablesExist(exists);
    } catch (error) {
      console.error('Error checking if tables exist:', error);
      setTablesExist(false);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlScript);
    alert('SQL script copied to clipboard!');
  };

  const handleTestTables = async () => {
    setIsTestingTables(true);
    try {
      const results = await testInventoryTables();
      setTestResults(results);
      
      // Also check table data
      const data = await checkTableData();
      setTableData(data);
      
      // Show success toast if all tables exist
      if (results.purchasesExists && results.salesExists && results.consumptionExists && results.balanceStockExists) {
        toast.success('All inventory tables and views are properly set up!');
      } else {
        toast.warning('Some inventory tables or views are missing. Please check the test results.');
      }
    } catch (error) {
      console.error('Error testing tables:', error);
      toast.error('Failed to test inventory tables: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsTestingTables(false);
    }
  };

  const handleInsertTestData = async () => {
    setIsInsertingTestData(true);
    try {
      const success = await insertTestPurchase();
      if (success) {
        toast.success('Test purchase record inserted successfully!');
        // Refresh table data
        const data = await checkTableData();
        setTableData(data);
      } else {
        toast.error('Failed to insert test purchase record.');
      }
    } catch (error) {
      console.error('Error inserting test data:', error);
      toast.error('Error inserting test data: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsInsertingTestData(false);
    }
  };

  const handleDebugSupabase = async () => {
    setIsDebugging(true);
    try {
      const debug = await debugSupabase();
      setDebugInfo(debug);
      
      if (debug.success) {
        toast.success('Supabase connection is working properly');
      } else {
        toast.warning('Supabase connection has issues. Check the debug information.');
      }
    } catch (error) {
      console.error('Error debugging Supabase:', error);
      toast.error('Failed to debug Supabase: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsDebugging(false);
    }
  };

  // Check if tables exist on page load
  React.useEffect(() => {
    // Wrap in a try-catch to prevent unhandled promise rejections
    const checkTables = async () => {
      try {
        await checkIfTablesExist();
      } catch (error) {
        console.error('Error in initial table check:', error);
        setTablesExist(false);
        setInitialLoading(false);
      }
    };
    
    checkTables();
  }, []);

  // Show a loading state while initial check is happening
  if (initialLoading) {
    return (
      <Container maxWidth="md">
        <Box sx={{ my: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
          <CircularProgress size={40} sx={{ mb: 3 }} />
          <Typography variant="h6">Checking database status...</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Inventory System Setup
        </Typography>

        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="body1" paragraph>
            Before using the inventory management system, you need to set up the required database tables in Supabase.
            This utility will create the necessary tables, indexes, and views for tracking purchases, sales, consumption,
            and balance stock.
          </Typography>

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Database Status:
            </Typography>
            {tablesExist === null ? (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                <Typography>Checking database status...</Typography>
              </Box>
            ) : tablesExist ? (
              <Alert severity="success">
                Inventory tables are properly set up in your Supabase database.
              </Alert>
            ) : (
              <Alert severity="warning">
                Inventory tables are not found in your Supabase database. Click the button below to set them up.
              </Alert>
            )}
          </Box>

          {status === 'success' && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {message}
            </Alert>
          )}

          {status === 'error' && (
            <Alert severity="error" sx={{ mb: 3 }}>
              Error: {message}
            </Alert>
          )}

          <Grid container spacing={2}>
            <Grid item>
              <Button
                variant="contained"
                onClick={handleSetupTables}
                disabled={isLoading || tablesExist === true}
                startIcon={isLoading && <CircularProgress size={20} color="inherit" />}
              >
                {isLoading ? 'Setting Up Tables...' : tablesExist ? 'Tables Already Exist' : 'Set Up Inventory Tables'}
              </Button>
            </Grid>
            
            <Grid item>
              <Button
                variant="outlined"
                onClick={handleTestTables}
                disabled={isTestingTables}
                startIcon={isTestingTables && <CircularProgress size={20} color="inherit" />}
              >
                {isTestingTables ? 'Testing...' : 'Test Tables'}
              </Button>
            </Grid>
            
            <Grid item>
              <Button
                variant="outlined"
                onClick={handleInsertTestData}
                disabled={isInsertingTestData || !tablesExist}
                startIcon={isInsertingTestData && <CircularProgress size={20} color="inherit" />}
              >
                {isInsertingTestData ? 'Inserting...' : 'Insert Test Data'}
              </Button>
            </Grid>
          </Grid>
          
          {testResults && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Test Results:
              </Typography>
              <ul>
                <li>Purchases Table: {testResults.purchasesExists ? '✅ Exists' : '❌ Missing'}</li>
                <li>Sales Table: {testResults.salesExists ? '✅ Exists' : '❌ Missing'}</li>
                <li>Consumption Table: {testResults.consumptionExists ? '✅ Exists' : '❌ Missing'}</li>
                <li>Balance Stock View: {testResults.balanceStockExists ? '✅ Exists' : '❌ Missing'}</li>
              </ul>
            </Box>
          )}
          
          {tableData && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Table Data:
              </Typography>
              <ul>
                <li>Purchases Count: {tableData.purchasesCount}</li>
                <li>Sales Count: {tableData.salesCount}</li>
                <li>Consumption Count: {tableData.consumptionCount}</li>
              </ul>
            </Box>
          )}
        </Paper>

        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Manual Setup Option
          </Typography>
          
          <Typography variant="body1" paragraph>
            If the automatic setup doesn't work, you can manually run the SQL script in the Supabase SQL Editor:
          </Typography>
          
          <ol>
            <li>
              <Typography paragraph>
                Log in to your Supabase dashboard at <Link href="https://app.supabase.io" target="_blank" rel="noopener noreferrer">https://app.supabase.io</Link>
              </Typography>
            </li>
            <li>
              <Typography paragraph>
                Select your project and go to the SQL Editor
              </Typography>
            </li>
            <li>
              <Typography paragraph>
                Copy the SQL script below and paste it into the SQL Editor
              </Typography>
            </li>
            <li>
              <Typography paragraph>
                Click "Run" to execute the script
              </Typography>
            </li>
          </ol>
          
          <Button 
            variant="outlined" 
            onClick={handleCopySql}
            sx={{ mb: 2 }}
          >
            Copy SQL Script
          </Button>
          
          <Button 
            variant="text" 
            onClick={() => setShowSql(!showSql)}
            sx={{ ml: 2, mb: 2 }}
          >
            {showSql ? 'Hide SQL' : 'Show SQL'}
          </Button>
          
          {showSql && (
            <Box 
              component="pre" 
              sx={{ 
                p: 2, 
                bgcolor: 'background.paper', 
                border: '1px solid', 
                borderColor: 'divider',
                borderRadius: 1,
                overflow: 'auto',
                maxHeight: '400px',
                fontSize: '0.875rem'
              }}
            >
              {sqlScript}
            </Box>
          )}
        </Paper>

        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Debug Supabase Connection
          </Typography>
          
          <Typography variant="body1" paragraph>
            If you're experiencing issues with the inventory system, you can run a diagnostic check on your Supabase connection:
          </Typography>
          
          <Button
            variant="outlined"
            color="info"
            onClick={handleDebugSupabase}
            disabled={isDebugging}
            startIcon={isDebugging && <CircularProgress size={20} color="inherit" />}
            sx={{ mb: 3 }}
          >
            {isDebugging ? 'Debugging...' : 'Run Diagnostic Check'}
          </Button>
          
          {debugInfo && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Diagnostic Results:
              </Typography>
              
              <Alert severity={debugInfo.connection.success ? "success" : "error"} sx={{ mb: 2 }}>
                Connection: {debugInfo.connection.message}
              </Alert>
              
              <Alert severity={debugInfo.auth.authenticated ? "success" : "warning"} sx={{ mb: 2 }}>
                Authentication: {debugInfo.auth.message}
              </Alert>
              
              <Typography variant="subtitle1" gutterBottom>
                Tables Status:
              </Typography>
              
              <ul>
                {Object.entries(debugInfo.tables).map(([table, exists]) => (
                  <li key={table}>
                    {table}: {exists ? '✅ Accessible' : '❌ Not accessible'}
                  </li>
                ))}
              </ul>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle2" color="text.secondary">
                Connection Details:
              </Typography>
              <Box component="pre" sx={{ 
                bgcolor: 'background.paper', 
                p: 2, 
                borderRadius: 1,
                overflow: 'auto',
                fontSize: '0.75rem',
                maxHeight: '200px'
              }}>
                {JSON.stringify(debugInfo.connection.details, null, 2)}
              </Box>
            </Box>
          )}
        </Paper>

        <Box>
          <Typography variant="h6" gutterBottom>
            Next Steps:
          </Typography>
          <Typography variant="body1" paragraph>
            After setting up the tables, return to the Inventory page to start using the system. You'll be able to:
          </Typography>
          <ul>
            <li>Add purchase records manually</li>
            <li>Sync sales data from your POS</li>
            <li>Track salon consumption</li>
            <li>Export consolidated inventory data to CSV</li>
          </ul>
        </Box>
      </Box>
    </Container>
  );
};

export default InventorySetup; 