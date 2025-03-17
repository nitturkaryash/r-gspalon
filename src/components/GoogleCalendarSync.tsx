import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  CircularProgress, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
  Alert,
  Tooltip,
  Snackbar,
  Switch,
  FormControlLabel
} from '@mui/material';
import { Event, Sync, CalendarMonth, CloudDone, CloudOff } from '@mui/icons-material';
import { googleCalendarService } from '../services/googleCalendarService';

interface GoogleCalendarSyncProps {
  appointments: any[];
  services: any[];
  stylists: any[];
  onSyncComplete?: (appointmentId: string, googleCalendarId: string) => Promise<void>;
}

export default function GoogleCalendarSync({ 
  appointments, 
  services, 
  stylists,
  onSyncComplete 
}: GoogleCalendarSyncProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const [selectedAppointments, setSelectedAppointments] = useState<string[]>([]);
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [syncResults, setSyncResults] = useState<{success: number, failed: number}>({ success: 0, failed: 0 });
  const [autoSync, setAutoSync] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Initialize Google Calendar API when component mounts
  useEffect(() => {
    const initGoogleCalendar = async () => {
      try {
        setIsLoading(true);
        await googleCalendarService.init();
        setIsInitialized(true);
        setIsConnected(googleCalendarService.isUserAuthorized());
      } catch (err) {
        console.error('Failed to initialize Google Calendar:', err);
        setError('Failed to initialize Google Calendar API');
      } finally {
        setIsLoading(false);
      }
    };

    initGoogleCalendar();
  }, []);

  // Auto-sync when appointment changes if autoSync is enabled
  useEffect(() => {
    if (autoSync && isConnected && appointments.length > 0) {
      handleSyncAll();
    }
  }, [autoSync, isConnected, appointments]);

  // Connect to Google Calendar
  const handleConnect = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await googleCalendarService.authorize();
      setIsConnected(true);
      showSnackbar('Connected to Google Calendar');
    } catch (err) {
      console.error('Failed to connect to Google Calendar:', err);
      setError('Failed to connect to Google Calendar. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Disconnect from Google Calendar
  const handleDisconnect = () => {
    try {
      googleCalendarService.signOut();
      setIsConnected(false);
      showSnackbar('Disconnected from Google Calendar');
    } catch (err) {
      console.error('Failed to disconnect from Google Calendar:', err);
      setError('Failed to disconnect from Google Calendar');
    }
  };

  // Open sync dialog
  const handleOpenSyncDialog = () => {
    // By default, select all appointments that don't have a Google Calendar ID
    const initialSelection = appointments
      .filter(appointment => !appointment.googleCalendarId)
      .map(appointment => appointment.id);
    
    setSelectedAppointments(initialSelection);
    setSyncDialogOpen(true);
    setSyncResults({ success: 0, failed: 0 });
  };

  // Close sync dialog
  const handleCloseSyncDialog = () => {
    setSyncDialogOpen(false);
    setSyncInProgress(false);
  };

  // Toggle appointment selection for sync
  const handleToggleAppointment = (appointmentId: string) => {
    setSelectedAppointments(prev => 
      prev.includes(appointmentId)
        ? prev.filter(id => id !== appointmentId)
        : [...prev, appointmentId]
    );
  };

  // Select all appointments for sync
  const handleSelectAll = () => {
    setSelectedAppointments(appointments.map(appointment => appointment.id));
  };

  // Deselect all appointments for sync
  const handleDeselectAll = () => {
    setSelectedAppointments([]);
  };

  // Sync selected appointments
  const handleSyncSelected = async () => {
    if (selectedAppointments.length === 0) {
      showSnackbar('No appointments selected for sync');
      return;
    }

    setSyncInProgress(true);
    let successCount = 0;
    let failedCount = 0;

    try {
      for (const appointmentId of selectedAppointments) {
        const appointment = appointments.find(a => a.id === appointmentId);
        if (!appointment) continue;

        const service = services.find(s => s.id === appointment.service_id);
        const stylist = stylists.find(s => s.id === appointment.stylist_id);

        try {
          const googleCalendarId = await googleCalendarService.syncAppointment(
            appointment, 
            service, 
            stylist
          );
          
          // Call the onSyncComplete callback if provided
          if (onSyncComplete) {
            await onSyncComplete(appointmentId, googleCalendarId);
          }
          
          successCount++;
        } catch (err) {
          console.error(`Failed to sync appointment ${appointmentId}:`, err);
          failedCount++;
        }
      }

      setSyncResults({ success: successCount, failed: failedCount });
      showSnackbar(`Synced ${successCount} appointments to Google Calendar`);
    } catch (err) {
      console.error('Error during sync:', err);
      setError('Failed to sync appointments with Google Calendar');
    } finally {
      setSyncInProgress(false);
    }
  };

  // Sync all appointments
  const handleSyncAll = async () => {
    setSelectedAppointments(appointments.map(appointment => appointment.id));
    if (!syncDialogOpen) {
      setSyncDialogOpen(true);
      setSyncResults({ success: 0, failed: 0 });
    }
    setTimeout(handleSyncSelected, 300);
  };

  // Show snackbar message
  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        {isLoading ? (
          <CircularProgress size={24} />
        ) : isConnected ? (
          <Tooltip title="Connected to Google Calendar">
            <CloudDone color="success" />
          </Tooltip>
        ) : (
          <Tooltip title="Not connected to Google Calendar">
            <CloudOff color="error" />
          </Tooltip>
        )}

        <Typography variant="subtitle1">
          {isConnected ? 'Connected to Google Calendar' : 'Not connected to Google Calendar'}
        </Typography>

        {isInitialized && (
          isConnected ? (
            <>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<Sync />}
                onClick={handleOpenSyncDialog}
                disabled={isLoading || syncInProgress}
              >
                Sync Appointments
              </Button>
              <Button
                variant="outlined"
                color="error"
                onClick={handleDisconnect}
                disabled={isLoading}
              >
                Disconnect
              </Button>
              <FormControlLabel
                control={
                  <Switch
                    checked={autoSync}
                    onChange={(e) => setAutoSync(e.target.checked)}
                    color="primary"
                  />
                }
                label="Auto-sync"
              />
            </>
          ) : (
            <Button
              variant="contained"
              color="primary"
              startIcon={<CalendarMonth />}
              onClick={handleConnect}
              disabled={isLoading}
            >
              Connect to Google Calendar
            </Button>
          )
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Sync Dialog */}
      <Dialog 
        open={syncDialogOpen} 
        onClose={handleCloseSyncDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Sync Appointments with Google Calendar
        </DialogTitle>
        <DialogContent>
          {syncInProgress ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
              <CircularProgress size={48} />
              <Typography variant="h6" sx={{ mt: 2 }}>
                Syncing appointments...
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Please wait while your appointments are being synced with Google Calendar.
              </Typography>
            </Box>
          ) : syncResults.success > 0 || syncResults.failed > 0 ? (
            <Box sx={{ my: 2 }}>
              <Alert severity={syncResults.failed > 0 ? "warning" : "success"}>
                <Typography variant="subtitle1">
                  Sync Results
                </Typography>
                <Typography>
                  Successfully synced: {syncResults.success} appointments
                </Typography>
                {syncResults.failed > 0 && (
                  <Typography>
                    Failed to sync: {syncResults.failed} appointments
                  </Typography>
                )}
              </Alert>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                <Button onClick={handleSyncSelected} color="primary" disabled={selectedAppointments.length === 0}>
                  Retry Failed
                </Button>
                <Button onClick={handleCloseSyncDialog} color="primary">
                  Close
                </Button>
              </Box>
            </Box>
          ) : (
            <>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Select the appointments you want to sync with Google Calendar.
              </Typography>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Button onClick={handleSelectAll} size="small">
                  Select All
                </Button>
                <Button onClick={handleDeselectAll} size="small">
                  Deselect All
                </Button>
              </Box>
              
              <List sx={{ maxHeight: '300px', overflow: 'auto', border: '1px solid #eee', borderRadius: 1 }}>
                {appointments.map(appointment => {
                  const service = services.find(s => s.id === appointment.service_id);
                  const stylist = stylists.find(s => s.id === appointment.stylist_id);
                  const startTime = new Date(appointment.start_time);
                  const isSelected = selectedAppointments.includes(appointment.id);
                  
                  return (
                    <React.Fragment key={appointment.id}>
                      <ListItem 
                        button 
                        onClick={() => handleToggleAppointment(appointment.id)}
                        selected={isSelected}
                        sx={{ 
                          backgroundColor: isSelected ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
                          opacity: appointment.googleCalendarId ? 0.7 : 1
                        }}
                      >
                        <ListItemText
                          primary={`${appointment.clients?.full_name || 'Unknown Client'} - ${service?.name || 'Unknown Service'}`}
                          secondary={
                            <>
                              <Typography component="span" variant="body2" color="text.primary">
                                {startTime.toLocaleString()} • {stylist?.name || 'Unknown Stylist'}
                              </Typography>
                              {appointment.googleCalendarId && (
                                <Typography component="span" variant="body2" color="primary">
                                  <br />Already synced to Google Calendar
                                </Typography>
                              )}
                            </>
                          }
                        />
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  );
                })}
              </List>
            </>
          )}
        </DialogContent>
        <DialogActions>
          {!syncInProgress && syncResults.success === 0 && syncResults.failed === 0 && (
            <>
              <Button onClick={handleCloseSyncDialog} color="inherit">
                Cancel
              </Button>
              <Button 
                onClick={handleSyncSelected} 
                color="primary" 
                variant="contained"
                disabled={selectedAppointments.length === 0}
                startIcon={<Sync />}
              >
                Sync {selectedAppointments.length} Appointments
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        message={snackbarMessage}
      />
    </>
  );
} 