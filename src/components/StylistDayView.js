import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Box, Paper, Typography, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, FormControl, InputLabel, Select, MenuItem, Grid, IconButton, Tooltip, Alert, useTheme, InputAdornment, Popover, TableContainer, Table, TableHead, TableBody, TableRow, TableCell, Divider } from '@mui/material';
import { styled } from '@mui/material/styles';
import { ChevronLeft, ChevronRight, Today, Receipt, CalendarMonth, Delete as DeleteIcon } from '@mui/icons-material';
import { format, addDays, isSameDay } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useClients } from '../hooks/useClients';
import { useServiceCollections } from '../hooks/useServiceCollections';
import { useCollectionServices } from '../hooks/useCollectionServices';
import { Search as SearchIcon } from '@mui/icons-material';
import { formatCurrency } from '../utils/format';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
// Custom implementations of date-fns functions
const formatTime = (time) => {
    const date = typeof time === 'string' ? new Date(time) : time;
    const hour = date.getHours();
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const period = hour >= 12 ? 'PM' : 'AM';
    return `${hour12}:00 ${period}`;
};
// Improved time formatting with options for 12-hour or 24-hour format
const formatTimeWithOptions = (date, use24Hour = false) => {
    if (use24Hour) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    }
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
};
// Define the time slots for the day with 30-minute intervals
const BUSINESS_HOURS = {
    start: 8, // 8 AM
    end: 20, // 8 PM
};
// Update the time slot height to make the calendar more readable
const TIME_SLOT_HEIGHT = 30; // Height in pixels for each 15-minute slot

// ScheduleGrid component for the appointment grid layout
const ScheduleGrid = styled(Box)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'row',
    flexGrow: 1,
    overflow: 'auto',
    position: 'relative',
    backgroundColor: theme.palette.background.default,
}));

// Styled components with responsive design
const DayViewContainer = styled(Box)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: theme.palette.background.default,
    overflow: 'hidden',
    borderRadius: theme.shape.borderRadius,
    boxShadow: theme.shadows[1],
}));
const DayViewHeader = styled(Box)(({ theme }) => ({
    padding: theme.spacing(2),
    backgroundColor: theme.palette.background.paper,
    borderBottom: `1px solid ${theme.palette.divider}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap', // Allow wrapping on small screens
    gap: theme.spacing(2),
    [theme.breakpoints.down('md')]: {
        flexDirection: 'column',
        alignItems: 'flex-start',
    },
}));
const DayViewContent = styled(Box)(({ theme }) => ({
    display: 'flex',
    flexGrow: 1,
    overflow: 'auto',
    position: 'relative',
    backgroundColor: theme.palette.background.default,
}));
const TimeColumn = styled(Box)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    borderRight: `1px solid ${theme.palette.divider}`,
    minWidth: '80px', // Width for time column
    position: 'sticky',
    left: 0,
    zIndex: 10,
    backgroundColor: theme.palette.background.paper,
    boxShadow: '2px 0 4px rgba(0, 0, 0, 0.1)',
}));
const HourLabel = styled(Box)(({ theme }) => ({
    height: TIME_SLOT_HEIGHT,
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'flex-end', // Right align time labels
    borderBottom: `1px solid ${theme.palette.divider}`,
    padding: theme.spacing(0, 1, 0, 0), // Right padding only
    fontWeight: 'normal',
    position: 'relative',
    boxSizing: 'border-box',
    fontSize: '0.75rem', // Smaller font size
    color: theme.palette.text.secondary,
}));
const TimeSlot = styled(Box)(({ theme }) => ({
    height: TIME_SLOT_HEIGHT,
    borderBottom: `1px solid ${theme.palette.divider}`,
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(0.75),
    backgroundColor: theme.palette.background.paper,
    position: 'relative',
    boxSizing: 'border-box',
    '&:last-child': {
        borderBottom: 'none',
    },
    '&:hover': {
        backgroundColor: theme.palette.action.hover,
    },
}));
const StylistColumn = styled(Box)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    minWidth: '200px',
    position: 'relative',
    borderRight: `1px solid ${theme.palette.divider}`,
    '&:last-child': {
        borderRight: 'none',
    },
}));
const StylistHeader = styled(Box)(({ theme }) => ({
    height: '50px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing(1, 2),
    backgroundColor: theme.palette.background.paper,
    borderBottom: `1px solid ${theme.palette.divider}`,
    position: 'sticky',
    top: 0,
    zIndex: 5,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
}));
const TimeLabel = styled(Typography)(({ theme }) => ({
    fontSize: '0.85rem', // Increased from 0.75rem for better readability
    color: theme.palette.text.secondary,
    width: '100%',
    textAlign: 'center',
}));
// Update the AppointmentSlot component
const AppointmentSlot = styled(Box)(({ theme }) => ({
    height: TIME_SLOT_HEIGHT,
    borderBottom: `1px solid ${theme.palette.divider}`,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    '&:hover': {
        backgroundColor: theme.palette.action.hover,
    },
    '&.blocked': {
        backgroundColor: 'rgba(211, 47, 47, 0.15)',
        cursor: 'not-allowed',
        '&:hover': {
            backgroundColor: 'rgba(211, 47, 47, 0.2)',
        },
    },
}));
// Update the AppointmentCard component for better alignment with Google Calendar style
const AppointmentCard = styled(Box)(({ theme, duration }) => ({
    position: 'absolute',
    left: theme.spacing(0.75),
    right: theme.spacing(0.75),
    height: `${duration}px`, // Explicitly set height in pixels
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    borderRadius: 8,
    padding: theme.spacing(1, 1.5),
    overflow: 'hidden',
    boxShadow: '0px 4px 12px rgba(107, 142, 35, 0.25)',
    zIndex: 1,
    fontSize: '0.9rem',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    border: '1px solid rgba(0, 0, 0, 0.1)',
    '&:hover': {
        boxShadow: '0px 2px 5px rgba(0, 0, 0, 0.2)',
        transform: 'translateY(-1px)',
    },
    // Ensure accurate positioning
    boxSizing: 'border-box',
    marginTop: 0,
    [theme.breakpoints.down('sm')]: {
        padding: theme.spacing(0.25, 0.5),
        fontSize: '0.75rem',
    },
}));
// Update the BreakCard component for better positioning
const BreakCard = styled(Box)(({ theme, duration }) => ({
    position: 'absolute',
    left: 0,
    right: 0,
    height: duration,
    backgroundColor: '#d32f2f',
    color: '#ffffff',
    borderRadius: 0,
    padding: theme.spacing(0.75, 1),
    overflow: 'hidden',
    boxShadow: 'none',
    // Ensure accurate positioning
    boxSizing: 'border-box',
    marginTop: 0,
    zIndex: 4,
    fontSize: '0.8rem',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    opacity: 0.9,
}));
// Update the generateTimeSlots function to create precise 15-minute intervals
const generateTimeSlots = () => {
    const slots = [];
    for (let hour = BUSINESS_HOURS.start; hour <= BUSINESS_HOURS.end; hour++) {
        // Add slots for 0 and 30 minutes
        slots.push({ hour, minute: 0 });
        if (hour < BUSINESS_HOURS.end) {
            slots.push({ hour, minute: 30 });
        }
    }
    return slots;
};
// Generate time options for dropdown selectors
const generateTimeOptions = () => {
    const options = [];
    for (let hour = BUSINESS_HOURS.start; hour <= BUSINESS_HOURS.end; hour++) {
        const period = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
        // Add options for 0 and 30 minutes
        options.push({
            value: `${hour}:00`,
            label: `${hour12}:00 ${period}`
        });
        if (hour < BUSINESS_HOURS.end) {
            options.push({
                value: `${hour}:30`,
                label: `${hour12}:30 ${period}`
            });
        }
    }
    return options;
};
// Create a helper function to format hour in 12-hour format with AM/PM
const formatHour = (hour) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
    return `${hour12}:00 ${period}`;
};
const StylistDayView = ({ stylists: initialStylists, appointments, services, selectedDate, onSelectTimeSlot, onUpdateAppointment, onDeleteAppointment, onAddBreak, onDateChange, onStylistsChange, }) => {
    const theme = useTheme();
    const [stylists, setStylists] = useState(initialStylists);
    const [selectedStylist, setSelectedStylist] = useState(null);
    const [currentDate, setCurrentDate] = useState(selectedDate || new Date());
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    // Add break dialog state
    const [breakDialogOpen, setBreakDialogOpen] = useState(false);
    const [breakFormData, setBreakFormData] = useState({
        startTime: '',
        endTime: '',
        reason: ''
    });
    // Update the editFormData state type
    const [editFormData, setEditFormData] = useState({
        clientName: '',
        serviceId: '',
        stylistId: '', // Add this field
        startTime: '',
        endTime: '',
        notes: '',
        mobileNumber: ''
    });
    // State for drag and drop
    const [draggedAppointment, setDraggedAppointment] = useState(null);
    // Add state for date picker popover
    const [datePickerAnchorEl, setDatePickerAnchorEl] = useState(null);
    const datePickerOpen = Boolean(datePickerAnchorEl);
    const timeSlots = generateTimeSlots();
    const timeOptions = generateTimeOptions();
    const handlePrevDay = () => {
        const newDate = addDays(currentDate, -1);
        setCurrentDate(newDate);
        // Notify parent component if callback is provided
        if (onDateChange) {
            onDateChange(newDate);
        }
    };
    const handleNextDay = () => {
        const newDate = addDays(currentDate, 1);
        setCurrentDate(newDate);
        // Notify parent component if callback is provided
        if (onDateChange) {
            onDateChange(newDate);
        }
    };
    const handleToday = () => {
        const today = new Date();
        setCurrentDate(today);
        // Notify parent component if callback is provided
        if (onDateChange) {
            onDateChange(today);
        }
    };
    const handleSlotClick = (stylistId, hour, minute) => {
        // Check if this time slot is during a break
        if (isBreakTime(stylistId, hour, minute)) {
            return; // Don't allow booking during breaks
        }
        // Create a new date object for the selected time with exact minutes
        const selectedTime = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), hour, minute, 0, 0);
        // Call the onSelectTimeSlot callback with the stylist ID and formatted time
        onSelectTimeSlot(stylistId, selectedTime);
    };
    const { clients, updateClient } = useClients();
    // Handle opening the edit dialog for an appointment
    const handleAppointmentClick = (appointment) => {
        setSelectedAppointment(appointment);
        // Format times for the time selectors
        const startDate = new Date(appointment.start_time);
        const endDate = new Date(appointment.end_time);
        // Update form data with all fields including stylistId
        setEditFormData({
            clientName: appointment.clients?.full_name || '',
            serviceId: appointment.service_id || '',
            stylistId: appointment.stylist_id || '',
            startTime: `${startDate.getHours()}:${startDate.getMinutes() === 0 ? '00' : startDate.getMinutes().toString().padStart(2, '0')}`,
            endTime: `${endDate.getHours()}:${endDate.getMinutes() === 0 ? '00' : endDate.getMinutes().toString().padStart(2, '0')}`,
            notes: appointment.notes || '',
            mobileNumber: appointment.clients?.phone || ''
        });
        setEditDialogOpen(true);
    };
    // Handle appointment click to expand/collapse details
    const toggleAppointmentDetails = (appointmentId) => {
        if (expandedAppointment === appointmentId) {
            setExpandedAppointment(null); // Collapse if already expanded
        }
        else {
            setExpandedAppointment(appointmentId); // Expand this appointment
        }
    };
    // Drag and drop handlers
    const handleDragStart = (e, appointment) => {
        // Store the appointment being dragged
        setDraggedAppointment(appointment);
        // Set the drag image and data
        e.dataTransfer.setData('text/plain', appointment.id);
        e.dataTransfer.effectAllowed = 'move';
    };
    const handleDragOver = (e, stylistId, hour, minute) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };
    const handleDrop = async (e, stylistId, hour, minute) => {
        e.preventDefault();
        // Check if this time slot is during a break
        if (isBreakTime(stylistId, hour, minute)) {
            setSnackbarMessage('Cannot move appointment to a break time');
            setSnackbarOpen(true);
            return;
        }
        if (draggedAppointment && onUpdateAppointment) {
            // Create a new date object for the drop target time with exact minutes
            const dropTime = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), hour, minute, 0, 0);
            // Calculate the original duration in minutes
            const originalStart = new Date(draggedAppointment.start_time);
            const originalEnd = new Date(draggedAppointment.end_time);
            const durationMinutes = (originalEnd.getTime() - originalStart.getTime()) / (1000 * 60);
            // Calculate the new end time by adding the same duration
            const newEndTime = new Date(dropTime.getTime() + durationMinutes * 60 * 1000);
            try {
                await onUpdateAppointment(draggedAppointment.id, {
                    ...draggedAppointment,
                    stylist_id: stylistId,
                    start_time: dropTime.toISOString(),
                    end_time: newEndTime.toISOString(),
                });
                // Clear the dragged appointment reference
                setDraggedAppointment(null);
            }
            catch (error) {
                console.error('Error updating appointment:', error);
                setSnackbarMessage('Failed to move appointment');
                setSnackbarOpen(true);
            }
        }
    };
    const handleEditDialogClose = () => {
        setEditDialogOpen(false);
        setSelectedAppointment(null);
        // Reset service filters when closing the dialog
        setSelectedServiceCollection('');
        setServiceSearchQuery('');
    };
    const handleUpdateAppointment = async () => {
        if (!selectedAppointment || !onUpdateAppointment)
            return;
        try {
            // Parse the time strings from the form data
            const [startHour, startMinute] = editFormData.startTime.split(':').map(Number);
            const [endHour, endMinute] = editFormData.endTime.split(':').map(Number);
            // Create Date objects with the current date and selected times
            const startTime = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), startHour, startMinute, 0, 0);
            const endTime = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), endHour, endMinute, 0, 0);
            // If end time is earlier than start time, assume it's the next day
            if (endTime < startTime) {
                endTime.setDate(endTime.getDate() + 1);
            }
            // Format as ISO strings for consistent storage
            const formattedStartTime = startTime.toISOString();
            const formattedEndTime = endTime.toISOString();
            // Check if this appointment would conflict with a break
            if (checkBreakConflict(editFormData.stylistId, formattedStartTime, formattedEndTime)) {
                setSnackbarMessage("This appointment conflicts with a stylist's break");
                setSnackbarOpen(true);
                return;
            }
            // Update the appointment with the new data
            await onUpdateAppointment(selectedAppointment.id, {
                ...selectedAppointment,
                stylist_id: editFormData.stylistId,
                service_id: editFormData.serviceId,
                start_time: formattedStartTime,
                end_time: formattedEndTime,
                notes: editFormData.notes,
                // Include client information if available
                client_id: selectedAppointment.client_id,
                clients: selectedAppointment.clients
            });
            // Close the dialog and reset state
            setEditDialogOpen(false);
            setSelectedAppointment(null);
            setEditFormData({
                clientName: '',
                serviceId: '',
                stylistId: '',
                startTime: '',
                endTime: '',
                notes: '',
                mobileNumber: ''
            });
        }
        catch (error) {
            console.error('Error updating appointment:', error);
            setSnackbarMessage('Failed to update appointment');
            setSnackbarOpen(true);
        }
    };
    // Add a helper function to check if an appointment conflicts with breaks
    const checkBreakConflict = (stylistId, startTime, endTime) => {
        const breaks = getStylistBreaks(stylistId);
        if (!breaks || breaks.length === 0)
            return false;
        const appointmentStart = new Date(startTime).getTime();
        const appointmentEnd = new Date(endTime).getTime();
        return breaks.some((breakItem) => {
            const breakStart = new Date(breakItem.startTime).getTime();
            const breakEnd = new Date(breakItem.endTime).getTime();
            return ((appointmentStart >= breakStart && appointmentStart < breakEnd) || // Appointment starts during break
                (appointmentEnd > breakStart && appointmentEnd <= breakEnd) || // Appointment ends during break
                (appointmentStart <= breakStart && appointmentEnd >= breakEnd) // Break is within appointment
            );
        });
    };
    const handleDeleteAppointment = async () => {
        if (!selectedAppointment || !onDeleteAppointment)
            return;
        if (window.confirm('Are you sure you want to delete this appointment?')) {
            try {
                await onDeleteAppointment(selectedAppointment.id);
                handleEditDialogClose();
            }
            catch (error) {
                console.error('Failed to delete appointment:', error);
                alert('Failed to delete appointment');
            }
        }
    };
    const handleTimeChange = (event, field) => {
        if (!selectedAppointment)
            return;
        // Get the selected time value (format: "hour:minute")
        const timeValue = event.target.value;
        const [hourStr, minuteStr] = timeValue.split(':');
        const hour = parseInt(hourStr, 10);
        const minute = parseInt(minuteStr, 10);
        // Create a new date object with the selected time
        const newTime = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), hour, minute, 0, 0);
        // Update the appropriate field in the editFormData state
        setEditFormData(prev => {
            if (!prev)
                return prev;
            // Create a copy of the previous state
            const updated = { ...prev };
            // Update the appropriate field
            if (field === 'startTime') {
                updated.startTime = timeValue;
                // If the new start time is after the end time, adjust the end time
                const [endHourStr, endMinuteStr] = updated.endTime.split(':');
                const endHour = parseInt(endHourStr, 10);
                const endMinute = parseInt(endMinuteStr, 10);
                if (hour > endHour || (hour === endHour && minute >= endMinute)) {
                    // Set end time to start time + 15 minutes
                    const newEndHour = minute >= 45 ? (hour + 1) % 24 : hour;
                    const newEndMinute = (minute + 15) % 60;
                    updated.endTime = `${newEndHour}:${newEndMinute.toString().padStart(2, '0')}`;
                }
            }
            else {
                updated.endTime = timeValue;
                // If the new end time is before the start time, adjust the start time
                const [startHourStr, startMinuteStr] = updated.startTime.split(':');
                const startHour = parseInt(startHourStr, 10);
                const startMinute = parseInt(startMinuteStr, 10);
                if (hour < startHour || (hour === startHour && minute <= startMinute)) {
                    // Set start time to end time - 15 minutes
                    const newStartMinute = minute < 15 ? 45 : minute - 15;
                    const newStartHour = minute < 15 ? (hour === 0 ? 23 : hour - 1) : hour;
                    updated.startTime = `${newStartHour}:${newStartMinute.toString().padStart(2, '0')}`;
                }
            }
            return updated;
        });
    };
    // Filter appointments for the current day
    const todayAppointments = appointments.filter(appointment => {
        const appointmentDate = new Date(appointment.start_time);
        return isSameDay(appointmentDate, currentDate);
    });
    // Add a helper function to ensure dates are consistently handled
    const normalizeDateTime = (dateTimeString) => {
        // Parse the input date string
        const dateTime = new Date(dateTimeString);
        // Create a new date object with the current date but time from the appointment
        const normalized = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), dateTime.getHours(), dateTime.getMinutes(), 0, 0);
        return normalized;
    };
    // Update the getAppointmentPosition function to ensure precise positioning
    const getAppointmentPosition = (startTime) => {
        // Use the normalized date to ensure consistent time interpretation
        const time = normalizeDateTime(startTime);
        // Calculate position based on business hours and exact minutes
        const hoursSinceStart = time.getHours() - BUSINESS_HOURS.start;
        const minutesSinceHourStart = time.getMinutes();
        // Calculate total minutes since the start of business hours and add 30 minutes
        const totalMinutesSinceStart = (hoursSinceStart * 60) + minutesSinceHourStart + 30;
        // Calculate position in pixels based on exact minutes
        // This ensures appointments are positioned exactly at their scheduled time
        const position = (totalMinutesSinceStart / 15) * TIME_SLOT_HEIGHT;
        return position;
    };
    // Update the getAppointmentDuration function to work with the new time slot height
    const getAppointmentDuration = (startTime, endTime) => {
        // Use normalized dates to ensure consistent time interpretation
        const start = normalizeDateTime(startTime);
        const end = normalizeDateTime(endTime);
        // Calculate duration in minutes
        const durationInMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
        // Calculate height in pixels based on exact minutes (not intervals)
        // This ensures appointments have the exact height for their duration
        const height = (durationInMinutes / 15) * TIME_SLOT_HEIGHT;
        return height;
    };
    const navigate = useNavigate();
    // Handle navigation to POS with appointment data
    const handleCreateBill = () => {
        if (!selectedAppointment)
            return;
        const service = services.find(s => s.id === selectedAppointment.service_id);
        // Navigate to POS with appointment data
        navigate('/pos', {
            state: {
                appointmentData: {
                    id: selectedAppointment.id,
                    clientName: selectedAppointment.clients?.full_name || '',
                    stylistId: selectedAppointment.stylist_id,
                    serviceId: selectedAppointment.service_id,
                    serviceName: service?.name || '',
                    servicePrice: service?.price || 0,
                    appointmentTime: selectedAppointment.start_time,
                    type: 'service' // Explicitly set type as service
                }
            }
        });
        // Close the edit dialog
        handleEditDialogClose();
    };
    // Get stylist breaks for the current day
    const getStylistBreaks = (stylistId) => {
        const stylist = stylists.find(s => s.id === stylistId);
        if (!stylist || !stylist.breaks || stylist.breaks.length === 0) {
            return [];
        }
        // Filter breaks for the current day
        return stylist.breaks.filter((breakItem) => {
            try {
                const breakDate = new Date(breakItem.startTime);
                // Debug log to help identify issues
                if (process.env.NODE_ENV === 'development') {
                    console.log('Break date comparison:', {
                        breakId: breakItem.id,
                        breakStartTime: breakItem.startTime,
                        breakDate: breakDate.toISOString(),
                        currentDate: currentDate.toISOString(),
                        isSameDay: isSameDay(breakDate, currentDate)
                    });
                }
                // Use date-fns isSameDay for reliable date comparison
                return isSameDay(breakDate, currentDate);
            }
            catch (error) {
                console.error('Error processing break date:', error, breakItem);
                return false;
            }
        });
    };
    // Check for appointment conflicts
    const checkForConflicts = () => {
        const conflicts = [];
        // Group appointments by stylist
        const appointmentsByStylist = {};
        appointments.forEach(appointment => {
            if (!appointmentsByStylist[appointment.stylist_id]) {
                appointmentsByStylist[appointment.stylist_id] = [];
            }
            appointmentsByStylist[appointment.stylist_id].push(appointment);
        });
        // Check each stylist's appointments for overlaps
        Object.keys(appointmentsByStylist).forEach(stylistId => {
            const stylistAppointments = appointmentsByStylist[stylistId];
            for (let i = 0; i < stylistAppointments.length; i++) {
                const appt1 = stylistAppointments[i];
                const start1 = normalizeDateTime(appt1.start_time);
                const end1 = normalizeDateTime(appt1.end_time);
                for (let j = i + 1; j < stylistAppointments.length; j++) {
                    const appt2 = stylistAppointments[j];
                    const start2 = normalizeDateTime(appt2.start_time);
                    const end2 = normalizeDateTime(appt2.end_time);
                    // Check if appointments overlap
                    if ((start1 < end2 && end1 > start2)) {
                        conflicts.push([appt1.id, appt2.id]);
                    }
                }
            }
        });
        return conflicts;
    };
    // Find conflicting appointments
    const conflicts = checkForConflicts();
    // Function to check if an appointment has conflicts
    const hasConflict = (appointmentId) => {
        return conflicts.some(conflict => conflict.includes(appointmentId));
    };
    // Snackbar close handler
    const handleSnackbarClose = () => {
        setSnackbarOpen(false);
    };
    // Fix the isBreakTime function to correctly detect breaks with 15-minute precision
    const isBreakTime = (stylistId, hour, minute) => {
        const stylist = stylists.find(s => s.id === stylistId);
        if (!stylist || !stylist.breaks || stylist.breaks.length === 0) {
            return false;
        }
        try {
            // Create a date object for the slot time
            const slotTime = new Date(currentDate);
            slotTime.setHours(hour, minute, 0, 0);
            const slotTimeValue = slotTime.getTime();
            // Create a date object for the end of the slot (add 30 minutes for a full slot)
            const slotEndTime = new Date(currentDate);
            slotEndTime.setHours(hour, minute + 30, 0, 0);
            const slotEndTimeValue = slotEndTime.getTime();
            // Get only breaks for the current day to improve performance
            const todayBreaks = stylist.breaks.filter((breakItem) => {
                const breakDate = new Date(breakItem.startTime);
                return isSameDay(breakDate, currentDate);
            });
            // Debug log for specific hour to track issues
            if (hour === 11) {
                console.log('Checking break at 11:00:', {
                    stylistId,
                    hour,
                    minute,
                    breaks: todayBreaks.map(b => ({
                        id: b.id,
                        startTime: new Date(b.startTime).toLocaleTimeString(),
                        endTime: new Date(b.endTime).toLocaleTimeString(),
                        normalizedStart: normalizeDateTime(b.startTime).toLocaleTimeString(),
                        normalizedEnd: normalizeDateTime(b.endTime).toLocaleTimeString()
                    }))
                });
            }
            // Check if any break overlaps with this time slot
            return todayBreaks.some((breakItem) => {
                try {
                    // Use normalized times for consistent handling
                    const breakStart = normalizeDateTime(breakItem.startTime).getTime();
                    const breakEnd = normalizeDateTime(breakItem.endTime).getTime();
                    // Check for any overlap between the slot and the break
                    const isOverlapping = (breakStart <= slotTimeValue && breakEnd > slotTimeValue) || // Break starts before/at slot and ends after slot start
                        (breakStart >= slotTimeValue && breakStart < slotEndTimeValue); // Break starts during the slot
                    return isOverlapping;
                }
                catch (error) {
                    console.error('Error checking break overlap:', error);
                    return false;
                }
            });
        }
        catch (error) {
            console.error('Error in isBreakTime:', error);
            return false;
        }
    };
    const handleBreakDialogOpen = (stylistId) => {
        const foundStylist = stylists.find(s => s.id === stylistId);
        if (foundStylist) {
            setSelectedStylist(foundStylist);
            setBreakFormData({
                startTime: `${BUSINESS_HOURS.start}:00`,
                endTime: `${BUSINESS_HOURS.start + 1}:00`,
                reason: ''
            });
            setBreakDialogOpen(true);
        }
    };
    const handleBreakDialogClose = () => {
        setBreakDialogOpen(false);
        setSelectedStylist(null);
        setBreakFormData({
            startTime: '',
            endTime: '',
            reason: ''
        });
    };
    const handleAddBreak = async () => {
        try {
            if (!selectedStylist)
                return;
            const { startTime, endTime, reason } = breakFormData;
            if (!startTime || !endTime) {
                setSnackbarMessage('Please select both start and end times');
                setSnackbarOpen(true);
                return;
            }
            // Create dates for validation
            const formattedStartDate = new Date(currentDate);
            const [startHour, startMinute] = startTime.split(':').map(Number);
            formattedStartDate.setHours(startHour, startMinute, 0, 0);
            const formattedEndDate = new Date(currentDate);
            const [endHour, endMinute] = endTime.split(':').map(Number);
            formattedEndDate.setHours(endHour, endMinute, 0, 0);
            if (formattedEndDate <= formattedStartDate) {
                setSnackbarMessage('End time must be after start time');
                setSnackbarOpen(true);
                return;
            }
            const breakData = {
                startTime: formattedStartDate.toISOString(),
                endTime: formattedEndDate.toISOString(),
                reason: reason || ''
            };
            await onAddBreak(selectedStylist.id, breakData);
            setBreakDialogOpen(false);
            setBreakFormData({
                startTime: '',
                endTime: '',
                reason: ''
            });
            // Update local state
            const newBreak = {
                ...breakData,
                id: `break-${Date.now()}` // Generate a temporary ID
            };
            const updatedStylists = stylists.map(stylist => stylist.id === selectedStylist.id
                ? { ...stylist, breaks: [...stylist.breaks, newBreak] }
                : stylist);
            setStylists(updatedStylists);
            setSelectedStylist({ ...selectedStylist, breaks: [...selectedStylist.breaks, newBreak] });
            setSnackbarMessage('Break added successfully');
            setSnackbarOpen(true);
        }
        catch (error) {
            console.error('Error adding break:', error);
            setSnackbarMessage('Failed to add break');
            setSnackbarOpen(true);
        }
    };
    const handleDeleteBreak = (index) => {
        if (!selectedStylist || !selectedStylist.breaks)
            return;
        const updatedBreaks = [...selectedStylist.breaks];
        updatedBreaks.splice(index, 1);
        const updatedStylists = stylists.map(stylist => stylist.id === selectedStylist.id
            ? { ...stylist, breaks: updatedBreaks }
            : stylist);
        setStylists(updatedStylists);
        setSelectedStylist({ ...selectedStylist, breaks: updatedBreaks });
        setSnackbarMessage('Break time removed successfully');
        setSnackbarOpen(true);
    };
    const BreakBlock = styled(Box)(({ theme }) => ({
        position: 'absolute',
        left: theme.spacing(0.75),
        right: theme.spacing(0.75),
        backgroundColor: theme.palette.error.main,
        color: theme.palette.error.contrastText,
        padding: theme.spacing(1),
        zIndex: 10,
        borderRadius: theme.shape.borderRadius,
        borderLeft: `4px solid ${theme.palette.error.dark}`,
        boxShadow: theme.shadows[2],
        overflow: 'hidden',
        '&:hover': {
            backgroundColor: theme.palette.error.dark,
        },
    }));
    // Update the time column rendering
    const renderTimeColumn = () => (_jsxs(TimeColumn, { children: [_jsx(StylistHeader, { children: _jsx(TimeLabel, { variant: "subtitle2", sx: { fontSize: '1rem', fontWeight: 'medium' }, children: "Time" }) }), timeSlots.map(({ hour, minute }) => (_jsx(TimeSlot, { children: minute === 0 ? (_jsx(TimeLabel, { sx: { fontWeight: 'medium' }, children: format(new Date().setHours(hour, minute), 'h:mm a') })) : (_jsx(TimeLabel, { sx: { fontSize: '0.75rem', opacity: 0.8 }, children: format(new Date().setHours(hour, minute), 'h:mm a') })) }, `time-${hour}-${minute}`)))] }));
    const { serviceCollections } = useServiceCollections();
    const { services: collectionServices, isLoading: isLoadingCollectionServices } = useCollectionServices();
    const [selectedServiceCollection, setSelectedServiceCollection] = useState('');
    const [serviceSearchQuery, setServiceSearchQuery] = useState('');
    const getFilteredServices = () => {
        // Use collectionServices if available, otherwise fall back to services
        const allServices = collectionServices || services || [];
        let filteredServices = [...allServices];
        // Filter by collection if one is selected
        if (selectedServiceCollection) {
            filteredServices = filteredServices.filter(service => service.collection_id === selectedServiceCollection);
        }
        // Filter by search query if one is entered
        if (serviceSearchQuery) {
            const query = serviceSearchQuery.toLowerCase();
            filteredServices = filteredServices.filter(service => service.name.toLowerCase().includes(query) ||
                (service.description && service.description.toLowerCase().includes(query)));
        }
        // Log for debugging
        console.log('Filtered services:', {
            selectedCollection: selectedServiceCollection,
            searchQuery: serviceSearchQuery,
            servicesCount: filteredServices.length,
            services: filteredServices
        });
        return filteredServices;
    };
    // Add handler for date picker icon click
    const handleDatePickerClick = (event) => {
        setDatePickerAnchorEl(event.currentTarget);
    };
    // Add handler for date picker close
    const handleDatePickerClose = () => {
        setDatePickerAnchorEl(null);
    };
    // Update the handleDateChange function
    const handleDateChange = (date) => {
        if (date) {
            setCurrentDate(date);
            // Notify parent component if callback is provided
            if (onDateChange) {
                onDateChange(date);
            }
            handleDatePickerClose();
        }
    };
    useEffect(() => {
        setStylists(initialStylists);
    }, [initialStylists]);
    useEffect(() => {
        if (onStylistsChange) {
            onStylistsChange(stylists);
        }
    }, [stylists, onStylistsChange]);
    const handleStylistClick = (stylistId) => {
        const foundStylist = stylists.find(s => s.id === stylistId);
        if (foundStylist) {
            setSelectedStylist(foundStylist);
            setBreakDialogOpen(true);
        }
    };
    return (_jsxs(DayViewContainer, { children: [_jsx(DayViewHeader, { children: _jsxs(Box, { display: "flex", alignItems: "center", children: [_jsx(IconButton, { onClick: handlePrevDay, children: _jsx(ChevronLeft, {}) }), _jsx(Typography, { variant: "h6", sx: { mx: 2 }, children: format(currentDate, 'EEEE, MMMM d, yyyy') }), _jsx(IconButton, { onClick: handleNextDay, children: _jsx(ChevronRight, {}) }), _jsx(Tooltip, { title: "Today", children: _jsx(IconButton, { onClick: handleToday, sx: { ml: 1 }, children: _jsx(Today, {}) }) }), _jsx(Tooltip, { title: "Select Date", children: _jsx(IconButton, { onClick: handleDatePickerClick, sx: {
                                    ml: 1,
                                    color: theme.palette.primary.main,
                                    '&:hover': {
                                        backgroundColor: theme.palette.action.hover
                                    }
                                }, children: _jsx(CalendarMonth, {}) }) }), _jsx(Popover, { open: datePickerOpen, anchorEl: datePickerAnchorEl, onClose: handleDatePickerClose, anchorOrigin: {
                                vertical: 'bottom',
                                horizontal: 'center',
                            }, transformOrigin: {
                                vertical: 'top',
                                horizontal: 'center',
                            }, PaperProps: {
                                sx: {
                                    p: 2,
                                    boxShadow: 3,
                                    borderRadius: 2
                                }
                            }, children: _jsxs(Box, { sx: { display: 'flex', flexDirection: 'column', width: 320 }, children: [_jsx(Typography, { variant: "h6", sx: { mb: 2, textAlign: 'center' }, children: "Select Date" }), _jsx(LocalizationProvider, { dateAdapter: AdapterDateFns, children: _jsx(DatePicker, { value: currentDate, onChange: handleDateChange, slotProps: {
                                                textField: {
                                                    variant: 'outlined',
                                                    fullWidth: true,
                                                    sx: { mb: 2 }
                                                }
                                            } }) }), _jsxs(Box, { sx: { display: 'flex', justifyContent: 'flex-end', mt: 1 }, children: [_jsx(Button, { onClick: handleDatePickerClose, sx: { mr: 1 }, children: "Cancel" }), _jsx(Button, { variant: "contained", onClick: () => {
                                                    handleDateChange(currentDate);
                                                }, children: "Apply" })] })] }) })] }) }), _jsxs(ScheduleGrid, { children: [renderTimeColumn(), stylists.map(stylist => (_jsxs(StylistColumn, { children: [_jsx(StylistHeader, { onClick: () => handleBreakDialogOpen(stylist.id), sx: {
                                    cursor: 'pointer',
                                    '&:hover': {
                                        backgroundColor: theme.palette.salon.oliveLight,
                                        opacity: 0.9
                                    }
                                }, children: _jsx(Typography, { variant: "subtitle2", children: stylist.name }) }), timeSlots.map(slot => (_jsx(AppointmentSlot, { onClick: () => handleSlotClick(stylist.id, slot.hour, slot.minute), onDragOver: (e) => handleDragOver(e, stylist.id, slot.hour, slot.minute), onDrop: (e) => handleDrop(e, stylist.id, slot.hour, slot.minute), sx: isBreakTime(stylist.id, slot.hour, slot.minute) ? {
                                    backgroundColor: 'transparent', // Completely transparent
                                    cursor: 'not-allowed',
                                    pointerEvents: 'none', // Prevent mouse events
                                    '&:hover': {
                                        backgroundColor: 'transparent' // No hover effect
                                    }
                                } : undefined }, `slot-${stylist.id}-${slot.hour}-${slot.minute}`))), todayAppointments
                                .filter(appointment => appointment.stylist_id === stylist.id)
                                .map(appointment => {
                                const service = services.find(s => s.id === appointment.service_id);
                                const top = getAppointmentPosition(appointment.start_time);
                                const duration = getAppointmentDuration(appointment.start_time, appointment.end_time);
                                // Create normalized dates for display to ensure correct time formatting
                                const startTimeDate = normalizeDateTime(appointment.start_time);
                                const endTimeDate = normalizeDateTime(appointment.end_time);
                                return (_jsxs(AppointmentCard, { duration: duration, style: {
                                        top: `${top}px`,
                                        height: `${duration}px`
                                    }, onClick: (e) => {
                                        // Prevent click when dragging is finished
                                        if (!draggedAppointment) {
                                            handleAppointmentClick(appointment);
                                        }
                                    }, draggable: true, onDragStart: (e) => handleDragStart(e, appointment), children: [_jsx(Typography, { variant: "caption", fontWeight: "bold", children: appointment.clients?.full_name || 'Unknown' }), _jsx(Typography, { variant: "caption", children: service?.name || 'Unknown Service' }), _jsxs(Typography, { variant: "caption", children: [formatTime(startTimeDate), " - ", formatTime(endTimeDate)] })] }, appointment.id));
                            }), getStylistBreaks(stylist.id).map((breakItem) => {
                                const breakDate = new Date(breakItem.startTime);
                                // Only show breaks for the current day
                                if (!isSameDay(breakDate, currentDate))
                                    return null;
                                // Normalize the break times to ensure consistent handling
                                const breakStartTime = normalizeDateTime(breakItem.startTime);
                                const breakEndTime = normalizeDateTime(breakItem.endTime);
                                // Log the break times for debugging
                                console.log('Break rendering:', {
                                    id: breakItem.id,
                                    startISOString: breakItem.startTime,
                                    endISOString: breakItem.endTime,
                                    normalizedStartTime: breakStartTime.toLocaleTimeString(),
                                    normalizedEndTime: breakEndTime.toLocaleTimeString(),
                                    startHour: breakStartTime.getHours(),
                                    startMinute: breakStartTime.getMinutes()
                                });
                                const top = getAppointmentPosition(breakItem.startTime);
                                const height = getAppointmentDuration(breakItem.startTime, breakItem.endTime);
                                return (_jsxs(BreakBlock, { sx: {
                                        top: `${top}px`,
                                        height: `${height}px`,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'flex-start',
                                        gap: 0.5
                                    }, children: [_jsx(Typography, { variant: "subtitle2", sx: { fontWeight: 'bold', fontSize: '0.75rem' }, children: "Break Time" }), _jsxs(Typography, { variant: "caption", sx: { fontSize: '0.7rem' }, children: [format(breakStartTime, 'h:mm a'), " - ", format(breakEndTime, 'h:mm a')] }), breakItem.reason && (_jsx(Typography, { variant: "caption", sx: { fontSize: '0.7rem', opacity: 0.9 }, children: breakItem.reason }))] }, breakItem.id));
                            })] }, stylist.id)))] }), _jsxs(Dialog, { open: editDialogOpen, onClose: handleEditDialogClose, maxWidth: "sm", fullWidth: true, children: [_jsx(DialogTitle, { children: "Edit Appointment" }), _jsx(DialogContent, { children: _jsxs(Grid, { container: true, spacing: 2, sx: { mt: 1 }, children: [_jsx(Grid, { item: true, xs: 12, children: _jsx(TextField, { label: "Client Name", value: editFormData.clientName, onChange: (e) => setEditFormData({ ...editFormData, clientName: e.target.value }), fullWidth: true, required: true }) }), _jsx(Grid, { item: true, xs: 12, children: _jsx(TextField, { label: "Mobile Number", value: editFormData.mobileNumber, onChange: (e) => setEditFormData({ ...editFormData, mobileNumber: e.target.value }), fullWidth: true, placeholder: "Enter client's mobile number", InputProps: {
                                            startAdornment: (_jsx(Box, { component: "span", sx: { color: 'text.secondary', mr: 1 }, children: "+" })),
                                        } }) }), _jsxs(Grid, { item: true, xs: 12, children: [_jsx(Typography, { variant: "subtitle1", gutterBottom: true, children: "Service Selection" }), _jsxs(Grid, { container: true, spacing: 2, sx: { mb: 2 }, children: [_jsx(Grid, { item: true, xs: 12, md: 6, children: _jsxs(FormControl, { fullWidth: true, variant: "outlined", children: [_jsx(InputLabel, { id: "edit-service-collection-label", children: "Service Collection" }), _jsxs(Select, { labelId: "edit-service-collection-label", value: selectedServiceCollection, onChange: (e) => setSelectedServiceCollection(e.target.value), label: "Service Collection", children: [_jsx(MenuItem, { value: "", children: _jsx("em", { children: "All Collections" }) }), serviceCollections?.map((collection) => (_jsx(MenuItem, { value: collection.id, children: collection.name }, collection.id)))] })] }) }), _jsx(Grid, { item: true, xs: 12, md: 6, children: _jsx(TextField, { fullWidth: true, variant: "outlined", placeholder: "Search services...", value: serviceSearchQuery, onChange: (e) => setServiceSearchQuery(e.target.value), InputProps: {
                                                            startAdornment: (_jsx(InputAdornment, { position: "start", children: _jsx(SearchIcon, {}) })),
                                                        } }) })] }), _jsx(Box, { sx: { maxHeight: '300px', overflow: 'auto', mb: 2 }, children: _jsx(Grid, { container: true, spacing: 1, children: getFilteredServices().length > 0 ? (getFilteredServices().map((service) => (_jsx(Grid, { item: true, xs: 12, sm: 6, children: _jsxs(Paper, { elevation: editFormData.serviceId === service.id ? 4 : 1, sx: {
                                                            p: 1.5,
                                                            cursor: 'pointer',
                                                            transition: 'all 0.2s',
                                                            border: editFormData.serviceId === service.id ? '2px solid' : '1px solid',
                                                            borderColor: editFormData.serviceId === service.id ? 'primary.main' : 'divider',
                                                            bgcolor: editFormData.serviceId === service.id ? 'rgba(25, 118, 210, 0.12)' : 'background.paper',
                                                            transform: editFormData.serviceId === service.id ? 'translateY(-3px)' : 'none',
                                                            boxShadow: editFormData.serviceId === service.id ? 3 : 1,
                                                            '&:hover': {
                                                                bgcolor: editFormData.serviceId === service.id ? 'rgba(25, 118, 210, 0.12)' : 'action.hover',
                                                                transform: 'translateY(-2px)',
                                                                boxShadow: 2
                                                            }
                                                        }, onClick: () => setEditFormData({ ...editFormData, serviceId: service.id }), children: [_jsxs(Typography, { variant: "subtitle1", fontWeight: editFormData.serviceId === service.id ? "bold" : "medium", color: editFormData.serviceId === service.id ? "primary.main" : "text.primary", children: [editFormData.serviceId === service.id && "✓ ", service.name] }), _jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', mt: 1 }, children: [_jsxs(Typography, { variant: "body2", color: "text.secondary", children: [service.duration, " min"] }), _jsx(Typography, { variant: "body1", fontWeight: "bold", children: formatCurrency(service.price) })] }), service.description && (_jsx(Typography, { variant: "body2", color: "text.secondary", sx: { mt: 1 }, children: service.description }))] }) }, service.id)))) : (_jsx(Grid, { item: true, xs: 12, children: _jsx(Alert, { severity: "info", children: "No services found. Try adjusting your search or selecting a different collection." }) })) }) })] }), _jsx(Grid, { item: true, xs: 6, children: _jsxs(FormControl, { fullWidth: true, required: true, children: [_jsx(InputLabel, { children: "Start Time" }), _jsx(Select, { value: editFormData.startTime, onChange: (e) => handleTimeChange(e, 'startTime'), label: "Start Time", children: timeOptions.map((option) => (_jsx(MenuItem, { value: option.value, children: option.label }, `start-${option.value}`))) })] }) }), _jsx(Grid, { item: true, xs: 6, children: _jsxs(FormControl, { fullWidth: true, required: true, children: [_jsx(InputLabel, { children: "End Time" }), _jsx(Select, { value: editFormData.endTime, onChange: (e) => handleTimeChange(e, 'endTime'), label: "End Time", children: timeOptions.map((option) => (_jsx(MenuItem, { value: option.value, children: option.label }, `end-${option.value}`))) })] }) }), _jsx(Grid, { item: true, xs: 12, children: _jsx(TextField, { label: "Notes", value: editFormData.notes, onChange: (e) => setEditFormData({ ...editFormData, notes: e.target.value }), multiline: true, rows: 3, fullWidth: true }) })] }) }), _jsxs(DialogActions, { children: [onDeleteAppointment && (_jsx(Button, { onClick: handleDeleteAppointment, color: "error", sx: { mr: 'auto' }, children: "Delete" })), _jsx(Button, { onClick: handleCreateBill, color: "success", startIcon: _jsx(Receipt, {}), children: "Create Bill" }), _jsx(Button, { onClick: handleEditDialogClose, children: "Cancel" }), _jsx(Button, { onClick: handleUpdateAppointment, variant: "contained", color: "primary", children: "Update" })] })] }), _jsxs(Dialog, { open: breakDialogOpen, onClose: handleBreakDialogClose, maxWidth: "md", fullWidth: true, children: [_jsx(DialogTitle, { children: "Manage Break Time" }), _jsxs(DialogContent, { dividers: true, children: [_jsxs(Box, { sx: { mb: 3 }, children: [_jsx(Typography, { variant: "h6", sx: { mb: 2, color: 'primary.main' }, children: "Add New Break" }), _jsxs(Grid, { container: true, spacing: 2, children: [_jsx(Grid, { item: true, xs: 12, sm: 6, children: _jsxs(FormControl, { fullWidth: true, children: [_jsx(InputLabel, { children: "Start Time" }), _jsx(Select, { value: breakFormData.startTime, onChange: (e) => setBreakFormData({ ...breakFormData, startTime: e.target.value }), label: "Start Time", children: timeOptions.map((option) => (_jsx(MenuItem, { value: option.value, children: option.label }, `break-start-${option.value}`))) })] }) }), _jsx(Grid, { item: true, xs: 12, sm: 6, children: _jsxs(FormControl, { fullWidth: true, children: [_jsx(InputLabel, { children: "End Time" }), _jsx(Select, { value: breakFormData.endTime, onChange: (e) => setBreakFormData({ ...breakFormData, endTime: e.target.value }), label: "End Time", children: timeOptions.map((option) => (_jsx(MenuItem, { value: option.value, children: option.label }, `break-end-${option.value}`))) })] }) }), _jsx(Grid, { item: true, xs: 12, children: _jsx(TextField, { label: "Reason", value: breakFormData.reason, onChange: (e) => setBreakFormData({ ...breakFormData, reason: e.target.value }), fullWidth: true, placeholder: "Optional: Enter reason for break" }) }), _jsx(Grid, { item: true, xs: 12, children: _jsx(Button, { onClick: handleAddBreak, variant: "contained", color: "primary", fullWidth: true, sx: { mt: 1 }, children: "Add Break" }) })] })] }), _jsx(Divider, { sx: { my: 3 } }), _jsxs(Box, { children: [_jsx(Typography, { variant: "h6", sx: { mb: 2, color: 'primary.main' }, children: "Existing Breaks" }), selectedStylist && selectedStylist.breaks && selectedStylist.breaks.length > 0 ? (_jsx(TableContainer, { component: Paper, variant: "outlined", children: _jsxs(Table, { size: "small", children: [_jsx(TableHead, { children: _jsxs(TableRow, { children: [_jsx(TableCell, { children: "Start Time" }), _jsx(TableCell, { children: "End Time" }), _jsx(TableCell, { children: "Reason" }), _jsx(TableCell, { align: "right", children: "Actions" })] }) }), _jsx(TableBody, { children: selectedStylist.breaks.map((breakItem, index) => (_jsxs(TableRow, { hover: true, children: [_jsx(TableCell, { children: formatTime(breakItem.startTime) }), _jsx(TableCell, { children: formatTime(breakItem.endTime) }), _jsx(TableCell, { children: breakItem.reason || '-' }), _jsx(TableCell, { align: "right", children: _jsx(IconButton, { size: "small", color: "error", onClick: () => handleDeleteBreak(index), title: "Delete break", children: _jsx(DeleteIcon, { fontSize: "small" }) }) })] }, index))) })] }) })) : (_jsx(Paper, { variant: "outlined", sx: {
                                            p: 2,
                                            textAlign: 'center',
                                            color: 'text.secondary',
                                            bgcolor: 'grey.50'
                                        }, children: _jsx(Typography, { children: "No breaks scheduled" }) }))] })] }), _jsx(DialogActions, { children: _jsx(Button, { onClick: handleBreakDialogClose, children: "Close" }) })] })] }));
};
export default StylistDayView;
