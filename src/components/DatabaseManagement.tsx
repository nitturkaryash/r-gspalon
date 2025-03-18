import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Alert,
  Snackbar,
  CircularProgress
} from '@mui/material';
import {
  BackupOutlined,
  RestoreOutlined,
  DeleteForeverOutlined,
  WarningAmberOutlined
} from '@mui/icons-material';
import { 
  saveBackupToFile, 
  importDatabaseData, 
  clearAllData, 
  loadBackupFile 
} from '../utils/databaseUtils';
import { useDatabase } from '../context/DatabaseProvider';
import { initDatabase } from '../db/database';

export const DatabaseManagement: React.FC = () => {
  const { isInitializing } = useDatabase();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [openClearConfirm, setOpenClearConfirm] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info' as 'error' | 'warning' | 'info' | 'success'
  });

  const handleBackup = async () => {
    try {
      setIsExporting(true);
      await saveBackupToFile();
      setSnackbar({
        open: true,
        message: 'Database backup saved successfully!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Backup failed:', error);
      setSnackbar({
        open: true,
        message: `Backup failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'error'
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleRestore = async () => {
    try {
      setIsImporting(true);
      const backupData = await loadBackupFile();
      await importDatabaseData(backupData);
      setSnackbar({
        open: true,
        message: 'Database restored successfully!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Restore failed:', error);
      setSnackbar({
        open: true,
        message: `Restore failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'error'
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleClearData = async () => {
    try {
      setIsClearing(true);
      await clearAllData();
      // Reinitialize with seed data
      await initDatabase();
      setSnackbar({
        open: true,
        message: 'Database cleared and reset with seed data!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Clear data failed:', error);
      setSnackbar({
        open: true,
        message: `Clear data failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'error'
      });
    } finally {
      setIsClearing(false);
      setOpenClearConfirm(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (isInitializing) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Database Management
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Backup, restore, or reset your local database. These actions affect all data stored in the browser.
      </Typography>

      <Card elevation={2} sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            <BackupOutlined fontSize="large" color="primary" sx={{ mr: 2 }} />
            <Box>
              <Typography variant="h6">Backup Database</Typography>
              <Typography variant="body2" color="text.secondary">
                Save all your data to a local JSON file that you can use to restore later.
              </Typography>
            </Box>
          </Box>
          <Button 
            variant="outlined" 
            color="primary" 
            onClick={handleBackup}
            disabled={isExporting}
            startIcon={isExporting ? <CircularProgress size={20} /> : null}
          >
            {isExporting ? 'Exporting...' : 'Export Backup'}
          </Button>
        </CardContent>
      </Card>

      <Card elevation={2} sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            <RestoreOutlined fontSize="large" color="primary" sx={{ mr: 2 }} />
            <Box>
              <Typography variant="h6">Restore Database</Typography>
              <Typography variant="body2" color="text.secondary">
                Restore from a previously created backup file. This will replace all current data.
              </Typography>
            </Box>
          </Box>
          <Button 
            variant="outlined" 
            color="primary" 
            onClick={handleRestore}
            disabled={isImporting}
            startIcon={isImporting ? <CircularProgress size={20} /> : null}
          >
            {isImporting ? 'Importing...' : 'Import Backup'}
          </Button>
        </CardContent>
      </Card>

      <Card elevation={2} sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            <DeleteForeverOutlined fontSize="large" color="error" sx={{ mr: 2 }} />
            <Box>
              <Typography variant="h6">Reset Database</Typography>
              <Typography variant="body2" color="text.secondary">
                Clear all data and restore to the initial seed data. This action cannot be undone!
              </Typography>
            </Box>
          </Box>
          <Button 
            variant="outlined" 
            color="error" 
            onClick={() => setOpenClearConfirm(true)}
            disabled={isClearing}
            startIcon={isClearing ? <CircularProgress size={20} /> : <WarningAmberOutlined />}
          >
            {isClearing ? 'Resetting...' : 'Reset Database'}
          </Button>
        </CardContent>
      </Card>

      {/* Confirmation Dialog for Clear Data */}
      <Dialog
        open={openClearConfirm}
        onClose={() => setOpenClearConfirm(false)}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <WarningAmberOutlined color="warning" sx={{ mr: 1 }} />
            Confirm Database Reset
          </Box>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will permanently delete all your data and restore the database to its initial seed state.
            This action cannot be undone.
          </DialogContentText>
          <Alert severity="warning" sx={{ mt: 2 }}>
            We recommend creating a backup before proceeding.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenClearConfirm(false)}>Cancel</Button>
          <Button onClick={handleClearData} color="error" variant="contained">
            Yes, Reset Everything
          </Button>
        </DialogActions>
      </Dialog>

      {/* Status Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}; 