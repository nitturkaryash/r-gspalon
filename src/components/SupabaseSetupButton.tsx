import React, { useState } from 'react';
import { Button, CircularProgress, Snackbar, Alert } from '@mui/material';
import { supabase } from '../utils/supabase/supabaseClient';
import { executeSql } from '../utils/supabase/directSqlExecution';

interface SupabaseSetupButtonProps {
  label?: string;
  setupSql: string;
  onSetupComplete?: () => void;
}

export const SupabaseSetupButton: React.FC<SupabaseSetupButtonProps> = ({ 
  label = 'Setup Database', 
  setupSql,
  onSetupComplete
}) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const handleSetup = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Execute the setup SQL
      const result = await executeSql(setupSql);
      
      if (!result.success) {
        throw new Error(result.error?.toString() || 'Failed to execute SQL');
      }
      
      setSuccess(true);
      if (onSetupComplete) {
        onSetupComplete();
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <>
      <Button 
        variant="contained" 
        color="primary" 
        onClick={handleSetup}
        disabled={loading}
        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
      >
        {loading ? 'Setting up...' : label}
      </Button>
      
      <Snackbar open={success} autoHideDuration={6000} onClose={() => setSuccess(false)}>
        <Alert severity="success">Database setup complete!</Alert>  
      </Snackbar>
      
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
        <Alert severity="error">
          Database setup failed: {error?.message || 'Unknown error'}
        </Alert>
      </Snackbar>
    </>
  );
};

export default SupabaseSetupButton; 