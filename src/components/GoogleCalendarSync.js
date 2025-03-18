import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useEffect } from 'react';
import { Box, Button, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, Typography, List, ListItem, ListItemText, Divider, Alert, Tooltip, Snackbar, Switch, FormControlLabel } from '@mui/material';
import { Sync, CalendarMonth, CloudDone, CloudOff } from '@mui/icons-material';
import { googleCalendarService } from '../services/googleCalendarService';
export default function GoogleCalendarSync({ appointments, services, stylists, onSyncComplete }) {
    const [isInitialized, setIsInitialized] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [syncDialogOpen, setSyncDialogOpen] = useState(false);
    const [selectedAppointments, setSelectedAppointments] = useState([]);
    const [syncInProgress, setSyncInProgress] = useState(false);
    const [syncResults, setSyncResults] = useState({ success: 0, failed: 0 });
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
            }
            catch (err) {
                console.error('Failed to initialize Google Calendar:', err);
                setError('Failed to initialize Google Calendar API');
            }
            finally {
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
        }
        catch (err) {
            console.error('Failed to connect to Google Calendar:', err);
            setError('Failed to connect to Google Calendar. Please try again.');
        }
        finally {
            setIsLoading(false);
        }
    };
    // Disconnect from Google Calendar
    const handleDisconnect = () => {
        try {
            googleCalendarService.signOut();
            setIsConnected(false);
            showSnackbar('Disconnected from Google Calendar');
        }
        catch (err) {
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
    const handleToggleAppointment = (appointmentId) => {
        setSelectedAppointments(prev => prev.includes(appointmentId)
            ? prev.filter(id => id !== appointmentId)
            : [...prev, appointmentId]);
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
                if (!appointment)
                    continue;
                const service = services.find(s => s.id === appointment.service_id);
                const stylist = stylists.find(s => s.id === appointment.stylist_id);
                try {
                    const googleCalendarId = await googleCalendarService.syncAppointment(appointment, service, stylist);
                    // Call the onSyncComplete callback if provided
                    if (onSyncComplete) {
                        await onSyncComplete(appointmentId, googleCalendarId);
                    }
                    successCount++;
                }
                catch (err) {
                    console.error(`Failed to sync appointment ${appointmentId}:`, err);
                    failedCount++;
                }
            }
            setSyncResults({ success: successCount, failed: failedCount });
            showSnackbar(`Synced ${successCount} appointments to Google Calendar`);
        }
        catch (err) {
            console.error('Error during sync:', err);
            setError('Failed to sync appointments with Google Calendar');
        }
        finally {
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
    const showSnackbar = (message) => {
        setSnackbarMessage(message);
        setSnackbarOpen(true);
    };
    // Handle snackbar close
    const handleSnackbarClose = () => {
        setSnackbarOpen(false);
    };
    return (_jsxs(_Fragment, { children: [_jsxs(Box, { sx: { display: 'flex', alignItems: 'center', gap: 2, mb: 2 }, children: [isLoading ? (_jsx(CircularProgress, { size: 24 })) : isConnected ? (_jsx(Tooltip, { title: "Connected to Google Calendar", children: _jsx(CloudDone, { color: "success" }) })) : (_jsx(Tooltip, { title: "Not connected to Google Calendar", children: _jsx(CloudOff, { color: "error" }) })), _jsx(Typography, { variant: "subtitle1", children: isConnected ? 'Connected to Google Calendar' : 'Not connected to Google Calendar' }), isInitialized && (isConnected ? (_jsxs(_Fragment, { children: [_jsx(Button, { variant: "outlined", color: "primary", startIcon: _jsx(Sync, {}), onClick: handleOpenSyncDialog, disabled: isLoading || syncInProgress, children: "Sync Appointments" }), _jsx(Button, { variant: "outlined", color: "error", onClick: handleDisconnect, disabled: isLoading, children: "Disconnect" }), _jsx(FormControlLabel, { control: _jsx(Switch, { checked: autoSync, onChange: (e) => setAutoSync(e.target.checked), color: "primary" }), label: "Auto-sync" })] })) : (_jsx(Button, { variant: "contained", color: "primary", startIcon: _jsx(CalendarMonth, {}), onClick: handleConnect, disabled: isLoading, children: "Connect to Google Calendar" })))] }), error && (_jsx(Alert, { severity: "error", sx: { mb: 2 }, onClose: () => setError(null), children: error })), _jsxs(Dialog, { open: syncDialogOpen, onClose: handleCloseSyncDialog, maxWidth: "md", fullWidth: true, children: [_jsx(DialogTitle, { children: "Sync Appointments with Google Calendar" }), _jsx(DialogContent, { children: syncInProgress ? (_jsxs(Box, { sx: { display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }, children: [_jsx(CircularProgress, { size: 48 }), _jsx(Typography, { variant: "h6", sx: { mt: 2 }, children: "Syncing appointments..." }), _jsx(Typography, { variant: "body2", color: "text.secondary", children: "Please wait while your appointments are being synced with Google Calendar." })] })) : syncResults.success > 0 || syncResults.failed > 0 ? (_jsxs(Box, { sx: { my: 2 }, children: [_jsxs(Alert, { severity: syncResults.failed > 0 ? "warning" : "success", children: [_jsx(Typography, { variant: "subtitle1", children: "Sync Results" }), _jsxs(Typography, { children: ["Successfully synced: ", syncResults.success, " appointments"] }), syncResults.failed > 0 && (_jsxs(Typography, { children: ["Failed to sync: ", syncResults.failed, " appointments"] }))] }), _jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', mt: 2 }, children: [_jsx(Button, { onClick: handleSyncSelected, color: "primary", disabled: selectedAppointments.length === 0, children: "Retry Failed" }), _jsx(Button, { onClick: handleCloseSyncDialog, color: "primary", children: "Close" })] })] })) : (_jsxs(_Fragment, { children: [_jsx(Typography, { variant: "body1", sx: { mb: 2 }, children: "Select the appointments you want to sync with Google Calendar." }), _jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', mb: 2 }, children: [_jsx(Button, { onClick: handleSelectAll, size: "small", children: "Select All" }), _jsx(Button, { onClick: handleDeselectAll, size: "small", children: "Deselect All" })] }), _jsx(List, { sx: { maxHeight: '300px', overflow: 'auto', border: '1px solid #eee', borderRadius: 1 }, children: appointments.map(appointment => {
                                        const service = services.find(s => s.id === appointment.service_id);
                                        const stylist = stylists.find(s => s.id === appointment.stylist_id);
                                        const startTime = new Date(appointment.start_time);
                                        const isSelected = selectedAppointments.includes(appointment.id);
                                        return (_jsxs(React.Fragment, { children: [_jsx(ListItem, { button: true, onClick: () => handleToggleAppointment(appointment.id), selected: isSelected, sx: {
                                                        backgroundColor: isSelected ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
                                                        opacity: appointment.googleCalendarId ? 0.7 : 1
                                                    }, children: _jsx(ListItemText, { primary: `${appointment.clients?.full_name || 'Unknown Client'} - ${service?.name || 'Unknown Service'}`, secondary: _jsxs(_Fragment, { children: [_jsxs(Typography, { component: "span", variant: "body2", color: "text.primary", children: [startTime.toLocaleString(), " \u2022 ", stylist?.name || 'Unknown Stylist'] }), appointment.googleCalendarId && (_jsxs(Typography, { component: "span", variant: "body2", color: "primary", children: [_jsx("br", {}), "Already synced to Google Calendar"] }))] }) }) }), _jsx(Divider, {})] }, appointment.id));
                                    }) })] })) }), _jsx(DialogActions, { children: !syncInProgress && syncResults.success === 0 && syncResults.failed === 0 && (_jsxs(_Fragment, { children: [_jsx(Button, { onClick: handleCloseSyncDialog, color: "inherit", children: "Cancel" }), _jsxs(Button, { onClick: handleSyncSelected, color: "primary", variant: "contained", disabled: selectedAppointments.length === 0, startIcon: _jsx(Sync, {}), children: ["Sync ", selectedAppointments.length, " Appointments"] })] })) })] }), _jsx(Snackbar, { open: snackbarOpen, autoHideDuration: 6000, onClose: handleSnackbarClose, message: snackbarMessage })] }));
}
