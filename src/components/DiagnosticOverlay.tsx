import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper, CircularProgress, Alert } from '@mui/material';
import { supabase, checkDatabaseConnection } from '../utils/supabase/supabaseClient';

// Define local connection status variables since the imports may not be available
let connectionStatus = 'initializing';
let connectionError: Error | null = null;

// Try to get the status from supabaseClient dynamically at runtime
try {
  // This will be executed at runtime when the module is loaded
  setTimeout(() => {
    // Using dynamic imports to avoid static import errors
    import('../utils/supabase/supabaseClient').then(module => {
      if (module.connectionStatus) connectionStatus = module.connectionStatus;
      if (module.connectionError) connectionError = module.connectionError;
      console.log('DiagnosticOverlay: Updated connection status from module:', connectionStatus);
    }).catch(err => {
      console.error('DiagnosticOverlay: Error importing connection status:', err);
    });
  }, 0);
} catch (e) {
  console.log('DiagnosticOverlay: Using fallback connection status variables');
}

interface ConnectionState {
  status: string;
  error: any;
  connected: boolean;
  checked: boolean;
}

export const DiagnosticOverlay = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    status: connectionStatus,
    error: connectionError,
    connected: false,
    checked: false
  });
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    // Check connection when the component mounts
    checkConnection();
  }, []);

  const checkConnection = async () => {
    setIsChecking(true);
    try {
      const result = await checkDatabaseConnection();
      setConnectionState({
        status: result.status,
        error: result.error,
        connected: result.connected,
        checked: true
      });
    } catch (error) {
      setConnectionState({
        status: 'exception',
        error,
        connected: false,
        checked: true
      });
    } finally {
      setIsChecking(false);
    }
  };

  const dismiss = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        p: 2,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
      }}
    >
      <Paper sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
        <Typography variant="h5" gutterBottom>
          Database Connection Diagnostic
        </Typography>
        
        <Alert severity={connectionState.connected ? "success" : "error"} sx={{ mb: 2 }}>
          Connection Status: {connectionState.status}
        </Alert>
        
        {isChecking ? (
          <Box display="flex" alignItems="center" my={2}>
            <CircularProgress size={24} sx={{ mr: 2 }} />
            <Typography>Checking database connection...</Typography>
          </Box>
        ) : (
          <Box>
            <Typography variant="subtitle1" fontWeight="bold">
              Connection Details:
            </Typography>
            <Typography variant="body2" component="pre" sx={{ 
              p: 2, 
              backgroundColor: '#f5f5f5', 
              borderRadius: 1, 
              overflowX: 'auto',
              whiteSpace: 'pre-wrap'
            }}>
              Status: {connectionState.status}
              {'\n'}
              Connected: {connectionState.connected ? 'Yes' : 'No'}
              {'\n'}
              Error: {connectionState.error ? JSON.stringify(connectionState.error, null, 2) : 'None'}
            </Typography>
          </Box>
        )}
        
        <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
          <Button 
            variant="contained" 
            color="primary"
            onClick={checkConnection}
            disabled={isChecking}
          >
            Check Connection
          </Button>
          <Button 
            variant="outlined"
            onClick={dismiss}
          >
            Dismiss
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default DiagnosticOverlay; 