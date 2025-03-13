import React, { useState } from 'react';
import { Box, Button, Typography, Paper, CircularProgress, Alert } from '@mui/material';
import { Container } from '@mui/material';
import { setupInventoryTables, checkInventoryTablesExist } from '../utils/supabase/setupInventoryTables';

const InventorySetup: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [tablesExist, setTablesExist] = useState<boolean | null>(null);

  const handleSetupTables = async () => {
    setIsLoading(true);
    setStatus('idle');
    setMessage('');
    
    try {
      await setupInventoryTables();
      setStatus('success');
      setMessage('Inventory tables have been successfully set up in Supabase.');
      checkIfTablesExist();
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const checkIfTablesExist = async () => {
    try {
      const exists = await checkInventoryTablesExist();
      setTablesExist(exists);
    } catch (error) {
      console.error('Error checking if tables exist:', error);
      setTablesExist(false);
    }
  };

  // Check if tables exist on page load
  React.useEffect(() => {
    checkIfTablesExist();
  }, []);

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

          <Button
            variant="contained"
            onClick={handleSetupTables}
            disabled={isLoading || tablesExist === true}
            startIcon={isLoading && <CircularProgress size={20} color="inherit" />}
          >
            {isLoading ? 'Setting Up Tables...' : tablesExist ? 'Tables Already Exist' : 'Set Up Inventory Tables'}
          </Button>
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