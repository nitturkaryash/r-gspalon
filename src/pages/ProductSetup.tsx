import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, Paper, CircularProgress, Alert, Divider, Link, Grid } from '@mui/material';
import { Container } from '@mui/material';
import { setupProductTables, checkProductTablesExist } from '../utils/supabase/setupProductTables';
import sqlScript from '../utils/supabase/product_tables.sql?raw';
import { toast } from 'react-toastify';
import { debugSupabase } from '../utils/supabase/debugSupabase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';

const ProductSetup: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [tablesExist, setTablesExist] = useState<boolean | null>(null);
  const [showSql, setShowSql] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isDebugging, setIsDebugging] = useState(false);
  const [isRefreshingSession, setIsRefreshingSession] = useState(false);
  const navigate = useNavigate();
  const { refreshSession } = useAuth();

  const handleSetupTables = async () => {
    setIsLoading(true);
    setStatus('idle');
    setMessage('');
    
    try {
      // Try to refresh the session first
      try {
        await refreshSession();
      } catch (error) {
        console.error('Failed to refresh session:', error);
        throw new Error('Authentication error. Please log in again.');
      }
      
      await setupProductTables();
      setStatus('success');
      setMessage('Product tables have been successfully set up in Supabase.');
      toast.success('Product tables created successfully!');
      checkIfTablesExist();
    } catch (error) {
      console.error('Error setting up product tables:', error);
      setStatus('error');
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setMessage(errorMessage);
      toast.error(`Failed to set up product tables: ${errorMessage}`);
      
      // If it's an authentication error, redirect to login
      if (error instanceof Error && 
          (error.message.includes('authentication') || 
           error.message.includes('session') || 
           error.message.includes('log in'))) {
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const checkIfTablesExist = async () => {
    try {
      const exists = await checkProductTablesExist();
      console.log('Product tables exist:', exists);
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
    toast.success('SQL script copied to clipboard!');
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

  // Try to refresh the session when the component mounts
  useEffect(() => {
    const tryRefreshSession = async () => {
      setIsRefreshingSession(true);
      try {
        await refreshSession();
      } catch (error) {
        console.error('Failed to refresh session:', error);
      } finally {
        setIsRefreshingSession(false);
      }
    };
    
    tryRefreshSession();
  }, [refreshSession]);

  // Check if tables exist on page load
  useEffect(() => {
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
  if (initialLoading || isRefreshingSession) {
    return (
      <Container maxWidth="md">
        <Box sx={{ my: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
          <CircularProgress size={40} sx={{ mb: 3 }} />
          <Typography variant="h6">{isRefreshingSession ? 'Refreshing session...' : 'Checking database status...'}</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Product System Setup
        </Typography>

        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="body1" paragraph>
            Before using the product management system, you need to set up the required database tables in Supabase.
            This utility will create the necessary tables, indexes, and policies for managing product collections and products.
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
                Product tables are properly set up in your Supabase database.
              </Alert>
            ) : (
              <Alert severity="warning">
                Product tables are not found in your Supabase database. Click the button below to set them up.
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
                {isLoading ? 'Setting Up Tables...' : tablesExist ? 'Tables Already Exist' : 'Set Up Product Tables'}
              </Button>
            </Grid>
          </Grid>
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
                Create a new query and paste the SQL script below
              </Typography>
            </li>
            <li>
              <Typography paragraph>
                Run the script to create the tables
              </Typography>
            </li>
          </ol>
          
          <Button 
            variant="outlined" 
            onClick={() => setShowSql(!showSql)}
            sx={{ mb: 2 }}
          >
            {showSql ? 'Hide SQL Script' : 'Show SQL Script'}
          </Button>
          
          <Button 
            variant="outlined" 
            onClick={handleCopySql}
            sx={{ ml: 2, mb: 2 }}
          >
            Copy SQL Script
          </Button>
          
          {showSql && (
            <Box 
              component="pre" 
              sx={{ 
                p: 2, 
                bgcolor: 'background.paper', 
                border: 1, 
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
            If you're experiencing issues with the product system, you can run a diagnostic check on your Supabase connection:
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
      </Box>
    </Container>
  );
};

export default ProductSetup; 