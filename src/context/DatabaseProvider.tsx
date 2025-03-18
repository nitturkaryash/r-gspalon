import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { db, initDatabase } from '../db/database';
import { Box, Typography, Button, CircularProgress } from '@mui/material';

interface DatabaseContextType {
  isInitialized: boolean;
  isInitializing: boolean;
  error: Error | null;
  retryInitialization: () => Promise<void>;
}

const DatabaseContext = createContext<DatabaseContextType>({
  isInitialized: false,
  isInitializing: true,
  error: null,
  retryInitialization: async () => {}
});

export const useDatabase = () => useContext(DatabaseContext);

interface DatabaseProviderProps {
  children: ReactNode;
}

export const DatabaseProvider: React.FC<DatabaseProviderProps> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const initialize = async () => {
    try {
      setIsInitializing(true);
      setError(null);
      await initDatabase();
      setIsInitialized(true);
    } catch (err) {
      console.error('Database initialization error:', err);
      setError(err instanceof Error ? err : new Error('Failed to initialize database'));
      setIsInitialized(false);
    } finally {
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    initialize();
  }, []);

  const retryInitialization = async () => {
    await initialize();
  };

  if (error) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh', 
        gap: 2,
        p: 3,
        textAlign: 'center'
      }}>
        <Typography variant="h5" color="error" gutterBottom>
          Database Initialization Error
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mb: 2 }}>
          {error.message}
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={retryInitialization}
          disabled={isInitializing}
        >
          {isInitializing ? 'Retrying...' : 'Retry Initialization'}
        </Button>
      </Box>
    );
  }

  if (isInitializing) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        gap: 2
      }}>
        <CircularProgress />
        <Typography variant="body1" color="text.secondary">
          Initializing database...
        </Typography>
      </Box>
    );
  }

  return (
    <DatabaseContext.Provider value={{ isInitialized, isInitializing, error, retryInitialization }}>
      {children}
    </DatabaseContext.Provider>
  );
}; 