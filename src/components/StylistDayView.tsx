import { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  TextField, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Grid,
  IconButton,
  Tooltip,
  SelectChangeEvent,
  Snackbar,
  Alert,
  useTheme,
  InputAdornment
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { ChevronLeft, ChevronRight, Today, Receipt } from '@mui/icons-material';
import { format, addDays, isSameDay } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useClients } from '../hooks/useClients';
import { StylistBreak } from '../hooks/useStylists';
import { useServiceCollections } from '../hooks/useServiceCollections';
import { useCollectionServices } from '../hooks/useCollectionServices';
import { Search as SearchIcon } from '@mui/icons-material';
import { formatCurrency } from '../utils/format';

// Custom implementations of date-fns functions
const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
};

// Define the time slots for the day (from 8 AM to 10 PM)
const BUSINESS_HOURS = {
  start: 8,  // 8 AM
  end: 22,   // 10 PM
};

// Update the time slot height to make the calendar more readable
const TIME_SLOT_HEIGHT = 30; // Increased from 15px to 30px for better visibility

// Styled components
const DayViewContainer = styled(Paper)(({ theme }) => ({
  height: 'calc(100vh - 120px)',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  backgroundColor: theme.palette.background.default,
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
}));

const DayViewHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: theme.spacing(2),
  borderBottom: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper, // White background
  boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.05)',
  borderTopLeftRadius: 28, // Match container
  borderTopRightRadius: 28, // Match container
}));

const ScheduleGrid = styled(Box)(({ theme }) => ({
  display: 'flex',
  flex: 1,
  overflow: 'auto',
}));

const TimeColumn = styled(Box)(({ theme }) => ({
  width: 100, // Increased from 80px to 100px for better readability
  flexShrink: 0,
  borderRight: `1px solid ${theme.palette.divider}`,
  position: 'sticky',
  left: 0,
  backgroundColor: theme.palette.background.paper,
  zIndex: 2,
}));

const StylistColumn = styled(Box)(({ theme }) => ({
  flex: 1,
  minWidth: 200, // Increased from 180px to 200px for better spacing
  borderRight: `1px solid ${theme.palette.divider}`,
  position: 'relative',
  backgroundColor: theme.palette.salon.offWhite,
}));

const StylistHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1.5), // Increased padding for better visibility
  textAlign: 'center',
  borderBottom: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.salon.oliveLight,
  position: 'sticky',
  top: 0,
  zIndex: 3,
  height: 56, // Increased from 48px to 56px for better visibility
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const TimeSlot = styled(Box)(({ theme }) => ({
  height: TIME_SLOT_HEIGHT,
  borderBottom: `1px solid ${theme.palette.divider}`,
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0.75), // Increased padding for better spacing
  backgroundColor: theme.palette.background.paper,
  position: 'relative',
  '&:last-child': {
    borderBottom: 'none',
  },
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

// Update the AppointmentCard component
const AppointmentCard = styled(Box)<{ duration: number }>(({ theme, duration }) => ({
  position: 'absolute',
  left: theme.spacing(0.75),
  right: theme.spacing(0.75),
  height: duration, // Use the calculated height directly
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  borderRadius: 8,
  padding: theme.spacing(1, 1.5), // Increased padding for better readability
  overflow: 'hidden',
  boxShadow: '0px 4px 12px rgba(107, 142, 35, 0.25)',
  zIndex: 1,
  fontSize: '0.9rem', // Increased from 0.75rem for better readability
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  transition: 'all 0.2s ease-in-out',
  cursor: 'move',
  border: '1px solid rgba(255, 255, 255, 0.25)',
  '&:hover': {
    boxShadow: '0px 6px 16px rgba(107, 142, 35, 0.4)',
    transform: 'translateY(-2px)',
  },
}));

// Update the BreakCard component to ensure it doesn't capture mouse events
const BreakCard = styled(Box)<{ duration: number }>(({ theme, duration }) => ({
  position: 'absolute',
  left: 0,
  right: 0,
  height: (duration / 15) * TIME_SLOT_HEIGHT, // Adjust for 15-minute slots
  backgroundColor: '#d32f2f', // Solid red color
  color: '#ffffff',
  borderRadius: 0,
  padding: theme.spacing(0.75, 1),
  overflow: 'hidden',
  boxShadow: 'none', // Remove the shadow completely
  zIndex: 20, // Very high z-index to ensure it's above everything
  fontSize: '0.75rem',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  transition: 'none', // Remove transitions
  border: 'none', // Remove border
  cursor: 'not-allowed',
  pointerEvents: 'none', // Prevent it from capturing mouse events
  '&:hover': {
    boxShadow: 'none', // No hover effect
  },
}));

// Update the generateTimeSlots function to create 15-minute intervals
const generateTimeSlots = () => {
  const slots = [];
  for (let hour = BUSINESS_HOURS.start; hour <= BUSINESS_HOURS.end; hour++) {
    // Add slots for 0, 15, 30, and 45 minutes
    slots.push({ hour, minute: 0 });
    if (hour < BUSINESS_HOURS.end) {
      slots.push({ hour, minute: 15 });
      slots.push({ hour, minute: 30 });
      slots.push({ hour, minute: 45 });
    }
  }
  return slots;
};

// Update the generateTimeOptions function to include 15-minute intervals
const generateTimeOptions = () => {
  const options = [];
  for (let hour = BUSINESS_HOURS.start; hour <= BUSINESS_HOURS.end; hour++) {
    const period = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
    
    // Add options for 0, 15, 30, and 45 minutes
    options.push({ 
      value: `${hour}:00`, 
      label: `${hour12}:00 ${period}` 
    });
    if (hour < BUSINESS_HOURS.end) {
      options.push({ 
        value: `${hour}:15`, 
        label: `${hour12}:15 ${period}` 
      });
      options.push({ 
        value: `${hour}:30`, 
        label: `${hour12}:30 ${period}` 
      });
      options.push({ 
        value: `${hour}:45`, 
        label: `${hour12}:45 ${period}` 
      });
    }
  }
  return options;
};

// Create a helper function to format hour in 12-hour format with AM/PM
const formatHour = (hour: number): string => {
  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
  return `${hour12}:00 ${period}`;
};

interface StylistDayViewProps {
  stylists: any[];
  appointments: any[];
  services: any[];
  selectedDate: Date;
  onSelectTimeSlot: (stylistId: string, time: Date) => void;
  onUpdateAppointment?: (appointmentId: string, updates: any) => Promise<void>;
  onDeleteAppointment?: (appointmentId: string) => Promise<void>;
  onAddBreak?: (stylistId: string, breakData: { startTime: string; endTime: string; reason?: string }) => Promise<void>;
}

export default function StylistDayView({
  stylists,
  appointments,
  services,
  selectedDate,
  onSelectTimeSlot,
  onUpdateAppointment,
  onDeleteAppointment,
  onAddBreak,
}: StylistDayViewProps) {
  const theme = useTheme();
  const [currentDate, setCurrentDate] = useState<Date>(selectedDate || new Date());
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState<boolean>(false);
  // Add break dialog state
  const [breakDialogOpen, setBreakDialogOpen] = useState<boolean>(false);
  const [selectedStylist, setSelectedStylist] = useState<string | null>(null);
  const [breakFormData, setBreakFormData] = useState({
    startTime: '',
    endTime: '',
    reason: ''
  });
  // Add back the editFormData state
  const [editFormData, setEditFormData] = useState({
    clientName: '',
    serviceId: '',
    startTime: '',
    endTime: '',
    notes: '',
    mobileNumber: ''
  });
  // State for drag and drop
  const [draggedAppointment, setDraggedAppointment] = useState<any | null>(null);
  
  const timeSlots = generateTimeSlots();
  const timeOptions = generateTimeOptions();
  
  const handlePrevDay = () => {
    setCurrentDate(prev => addDays(prev, -1));
  };
  
  const handleNextDay = () => {
    setCurrentDate(prev => addDays(prev, 1));
  };
  
  const handleToday = () => {
    setCurrentDate(new Date());
  };
  
  const handleSlotClick = (stylistId: string, hour: number, minute: number) => {
    // Check if this time is during a break
    if (isBreakTime(stylistId, hour, minute)) {
      // Instead of using toast directly, set a state variable for snackbar
      setSnackbarMessage("Cannot schedule during stylist's break time");
      setSnackbarOpen(true);
      return;
    }
    
    const time = new Date(currentDate);
    time.setHours(hour, minute, 0, 0);
    onSelectTimeSlot(stylistId, time);
  };

  const { clients, updateClient } = useClients();

  const handleAppointmentClick = (appointment: any) => {
    setSelectedAppointment(appointment);
    
    // Format times for the time selectors
    const startDate = new Date(appointment.start_time);
    const endDate = new Date(appointment.end_time);
    
    // Ensure we have the client_id for this appointment
    let clientId = appointment.client_id;
    
    // If no client_id but we have a client name, try to find the client by name
    if (!clientId && appointment.clients?.full_name && clients) {
      const client = clients.find(c => 
        c.full_name.toLowerCase() === appointment.clients.full_name.toLowerCase()
      );
      if (client) {
        clientId = client.id;
        // Update the appointment with the client ID for future reference
        appointment.client_id = clientId;
      }
    }
    
    setEditFormData({
      clientName: appointment.clients?.full_name || '',
      serviceId: appointment.service_id || '',
      startTime: `${startDate.getHours()}:${startDate.getMinutes() === 0 ? '00' : '30'}`,
      endTime: `${endDate.getHours()}:${endDate.getMinutes() === 0 ? '00' : '30'}`,
      notes: appointment.notes || '',
      mobileNumber: appointment.clients?.phone || ''
    });
    
    // Reset service filters when opening the dialog
    setSelectedServiceCollection('');
    setServiceSearchQuery('');
    
    setEditDialogOpen(true);
  };
  
  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, appointment: any) => {
    // Store the appointment being dragged
    setDraggedAppointment(appointment);
    // Set the drag image and data
    e.dataTransfer.setData('text/plain', appointment.id);
    e.dataTransfer.effectAllowed = 'move';
  };
  
  const handleDragOver = (e: React.DragEvent, stylistId: string, hour: number, minute: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  
  const handleDrop = async (e: React.DragEvent, stylistId: string, hour: number, minute: number) => {
    e.preventDefault();
    
    // Ensure we have a dragged appointment and update function
    if (!draggedAppointment || !onUpdateAppointment) return;
    
    try {
      // Create the new time for the appointment
      const startTime = new Date(currentDate);
      startTime.setHours(hour, minute, 0, 0);
      
      // Calculate the appointment duration in milliseconds
      const originalStartTime = new Date(draggedAppointment.start_time);
      const originalEndTime = new Date(draggedAppointment.end_time);
      const durationMs = originalEndTime.getTime() - originalStartTime.getTime();
      
      // Calculate the new end time by adding the same duration
      const endTime = new Date(startTime.getTime() + durationMs);
      
      // Update the appointment
      await onUpdateAppointment(draggedAppointment.id, {
        stylist_id: stylistId, // Allow changing stylist
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString()
      });
      
      // Reset drag state
      setDraggedAppointment(null);
    } catch (error) {
      console.error('Failed to update appointment during drag', error);
      setDraggedAppointment(null);
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
    if (!selectedAppointment || !onUpdateAppointment) return;
    
    // Parse the selected times
    const [startHour, startMinute] = editFormData.startTime.split(':').map(Number);
    const [endHour, endMinute] = editFormData.endTime.split(':').map(Number);
    
    // Create Date objects for the start and end times
    const startTime = new Date(currentDate);
    startTime.setHours(startHour, startMinute, 0, 0);
    
    const endTime = new Date(currentDate);
    endTime.setHours(endHour, endMinute, 0, 0);
    
    // Ensure end time is after start time
    if (endTime <= startTime) {
      alert('End time must be after start time');
      return;
    }
    
    try {
      // Update the appointment
      await onUpdateAppointment(selectedAppointment.id, {
        client_name: editFormData.clientName,
        service_id: editFormData.serviceId,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        notes: editFormData.notes,
        phone: editFormData.mobileNumber
      });
      
      // If we have a client ID and a mobile number, update the client record
      if (selectedAppointment.client_id && editFormData.mobileNumber) {
        // Update the client record with the new phone number
        await updateClient({
          id: selectedAppointment.client_id,
          phone: editFormData.mobileNumber
        });
        
        // Also update the clients reference in the current appointment for immediate display
        selectedAppointment.clients = {
          ...selectedAppointment.clients,
          phone: editFormData.mobileNumber
        };
      }
      
      handleEditDialogClose();
    } catch (error) {
      console.error('Failed to update appointment:', error);
      alert('Failed to update appointment');
    }
  };
  
  const handleDeleteAppointment = async () => {
    if (!selectedAppointment || !onDeleteAppointment) return;
    
    if (window.confirm('Are you sure you want to delete this appointment?')) {
      try {
        await onDeleteAppointment(selectedAppointment.id);
        handleEditDialogClose();
      } catch (error) {
        console.error('Failed to delete appointment:', error);
        alert('Failed to delete appointment');
      }
    }
  };
  
  const handleTimeChange = (event: SelectChangeEvent, field: 'startTime' | 'endTime') => {
    setEditFormData({
      ...editFormData,
      [field]: event.target.value
    });
  };
  
  // Filter appointments for the current day
  const todayAppointments = appointments.filter(appointment => {
    const appointmentDate = new Date(appointment.start_time);
    return isSameDay(appointmentDate, currentDate);
  });
  
  // Add a helper function to ensure dates are consistently handled
  const normalizeDateTime = (dateTimeString: string) => {
    // Parse the input date string
    const dateTime = new Date(dateTimeString);
    
    // Log the original date for debugging
    console.log('Normalizing date:', {
      original: dateTimeString,
      parsed: dateTime.toLocaleString(),
      hours: dateTime.getHours(),
      minutes: dateTime.getMinutes()
    });
    
    // Explicitly preserve the time components while normalizing to the current date
    const normalized = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate(),
      dateTime.getHours(),
      dateTime.getMinutes(),
      0,
      0
    );
    
    // Log the normalized date for debugging
    console.log('Normalized date:', {
      result: normalized.toLocaleString(),
      hours: normalized.getHours(),
      minutes: normalized.getMinutes()
    });
    
    return normalized;
  };

  // Update the getAppointmentPosition function to correctly calculate positions
  const getAppointmentPosition = (startTime: string) => {
    // Use the normalized date to ensure consistent time interpretation
    const time = normalizeDateTime(startTime);
    
    // Log for debugging the time being processed
    console.log('Calculating position for:', {
      timeString: startTime,
      normalizedTime: time.toLocaleTimeString(),
      hours: time.getHours(),
      minutes: time.getMinutes()
    });
    
    // Calculate position based on business hours and 15-minute intervals
    const hoursSinceStart = time.getHours() - BUSINESS_HOURS.start;
    const minutesSinceHourStart = time.getMinutes();
    
    // Calculate total minutes since the start of business hours
    const totalMinutesSinceStart = (hoursSinceStart * 60) + minutesSinceHourStart;
    
    // Calculate total 15-minute intervals since the start of business hours
    // Ensure we're using exact intervals without any rounding issues
    const totalIntervals = Math.round(totalMinutesSinceStart / 15);
    
    // Calculate position in pixels (each interval is TIME_SLOT_HEIGHT pixels)
    const position = totalIntervals * TIME_SLOT_HEIGHT;
    
    console.log('Position calculation:', {
      hour: time.getHours(),
      businessStart: BUSINESS_HOURS.start,
      hourDiff: hoursSinceStart,
      minute: minutesSinceHourStart,
      totalMinutesSinceStart,
      totalIntervals,
      position
    });
    
    return position;
  };
  
  // Update the getAppointmentDuration function to work with the new time slot height
  const getAppointmentDuration = (startTime: string, endTime: string) => {
    // Use normalized dates to ensure consistent time interpretation
    const start = normalizeDateTime(startTime);
    const end = normalizeDateTime(endTime);
    
    // Calculate duration in minutes
    const durationInMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
    
    // Calculate number of 15-minute intervals (round up to ensure coverage)
    const intervals = Math.ceil(durationInMinutes / 15);
    
    // Convert to pixels based on TIME_SLOT_HEIGHT (30px per 15-minute interval)
    const height = intervals * TIME_SLOT_HEIGHT;
    
    console.log('Duration calculation:', {
      startTime: start.toLocaleTimeString(),
      endTime: end.toLocaleTimeString(),
      durationInMinutes,
      intervals,
      height
    });
    
    return height;
  };

  const navigate = useNavigate();

  // Handle navigation to POS with appointment data
  const handleCreateBill = () => {
    if (!selectedAppointment) return;
    
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
          appointmentTime: selectedAppointment.start_time
        }
      }
    });
  };

  // Get stylist breaks for the current day
  const getStylistBreaks = (stylistId: string) => {
    const stylist = stylists.find(s => s.id === stylistId);
    if (!stylist || !stylist.breaks || stylist.breaks.length === 0) {
      return [];
    }
    
    // Filter breaks for the current day
    return stylist.breaks.filter((breakItem: StylistBreak) => {
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
      } catch (error) {
        console.error('Error processing break date:', error, breakItem);
        return false;
      }
    });
  };

  // Add state for snackbar
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Add handleSnackbarClose function
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  // Fix the isBreakTime function to correctly detect breaks with 15-minute precision
  const isBreakTime = (stylistId: string, hour: number, minute: number) => {
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
      const todayBreaks = stylist.breaks.filter((breakItem: StylistBreak) => {
        const breakDate = new Date(breakItem.startTime);
        return isSameDay(breakDate, currentDate);
      });
      
      // Debug log for specific hour to track issues
      if (hour === 11) {
        console.log('Checking break at 11:00:', {
          stylistId,
          hour,
          minute,
          slotTime: slotTime.toLocaleTimeString(),
          slotEndTime: slotEndTime.toLocaleTimeString(),
          breaks: todayBreaks.map((b: StylistBreak) => ({
            startTime: new Date(b.startTime).toLocaleTimeString(),
            endTime: new Date(b.endTime).toLocaleTimeString(),
            normalizedStart: normalizeDateTime(b.startTime).toLocaleTimeString(),
            normalizedEnd: normalizeDateTime(b.endTime).toLocaleTimeString()
          }))
        });
      }
      
      // Check if the slot time overlaps with any break period
      return todayBreaks.some((breakItem: StylistBreak) => {
        try {
          // Use normalized times for consistent handling
          const breakStart = normalizeDateTime(breakItem.startTime).getTime();
          const breakEnd = normalizeDateTime(breakItem.endTime).getTime();
          
          // Check for any overlap between the slot and the break
          return (
            // Check if the slot starts during a break
            (slotTimeValue >= breakStart && slotTimeValue < breakEnd) ||
            // Check if the slot ends during a break
            (slotEndTimeValue > breakStart && slotEndTimeValue <= breakEnd) ||
            // Check if the slot completely contains a break
            (slotTimeValue <= breakStart && slotEndTimeValue >= breakEnd)
          );
        } catch (error) {
          console.error('Error checking break time:', error, breakItem);
          return false;
        }
      });
    } catch (error) {
      console.error('Error in isBreakTime:', error);
      return false;
    }
  };

  const handleBreakDialogOpen = (stylistId: string) => {
    setSelectedStylist(stylistId);
    setBreakFormData({
      startTime: `${BUSINESS_HOURS.start}:00`,
      endTime: `${BUSINESS_HOURS.start + 1}:00`,
      reason: ''
    });
    setBreakDialogOpen(true);
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
    if (!selectedStylist || !onAddBreak) return;

    try {
      // Create Date objects for the break times
      const startDate = new Date(currentDate);
      const [startHour, startMinute] = breakFormData.startTime.split(':').map(Number);
      startDate.setHours(startHour, startMinute, 0, 0);

      const endDate = new Date(currentDate);
      const [endHour, endMinute] = breakFormData.endTime.split(':').map(Number);
      endDate.setHours(endHour, endMinute, 0, 0);

      // Ensure end time is after start time
      if (endDate <= startDate) {
        setSnackbarMessage('End time must be after start time');
        setSnackbarOpen(true);
        return;
      }

      // Ensure the dates are interpreted correctly by explicitly setting them to the current date
      // This fixes potential timezone issues
      const formattedStartDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        currentDate.getDate(),
        startHour,
        startMinute,
        0,
        0
      );

      const formattedEndDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        currentDate.getDate(),
        endHour,
        endMinute,
        0,
        0
      );

      console.log('Adding break with times:', {
        startRaw: startDate.toISOString(),
        endRaw: endDate.toISOString(),
        startFormatted: formattedStartDate.toISOString(),
        endFormatted: formattedEndDate.toISOString(),
        currentDate: currentDate.toISOString()
      });

      await onAddBreak(selectedStylist, {
        startTime: formattedStartDate.toISOString(),
        endTime: formattedEndDate.toISOString(),
        reason: breakFormData.reason
      });

      handleBreakDialogClose();
    } catch (error) {
      console.error('Failed to add break:', error);
      setSnackbarMessage('Failed to add break');
      setSnackbarOpen(true);
    }
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
  const renderTimeColumn = () => (
    <TimeColumn>
      <StylistHeader>
        <TimeLabel variant="subtitle2" sx={{ fontSize: '1rem', fontWeight: 'medium' }}>
          Time
        </TimeLabel>
      </StylistHeader>
      {timeSlots.map(({ hour, minute }) => (
        <TimeSlot key={`time-${hour}-${minute}`}>
          {/* Only show the hour label for the first slot of each hour */}
          {minute === 0 ? (
            <TimeLabel sx={{ fontWeight: 'medium' }}>
              {format(new Date().setHours(hour, minute), 'h:mm a')}
            </TimeLabel>
          ) : (
            <TimeLabel sx={{ fontSize: '0.75rem', opacity: 0.8 }}>
              {format(new Date().setHours(hour, minute), 'h:mm a')}
            </TimeLabel>
          )}
        </TimeSlot>
      ))}
    </TimeColumn>
  );

  const { serviceCollections } = useServiceCollections();
  const { services: collectionServices, isLoading: isLoadingCollectionServices } = useCollectionServices();
  const [selectedServiceCollection, setSelectedServiceCollection] = useState<string>('');
  const [serviceSearchQuery, setServiceSearchQuery] = useState<string>('');

  const getFilteredServices = () => {
    // Use collectionServices if available, otherwise fall back to services
    const allServices = collectionServices || services || [];
    
    let filteredServices = [...allServices];
    
    // Filter by collection if one is selected
    if (selectedServiceCollection) {
      filteredServices = filteredServices.filter(service => 
        service.collection_id === selectedServiceCollection
      );
    }
    
    // Filter by search query if one is entered
    if (serviceSearchQuery) {
      const query = serviceSearchQuery.toLowerCase();
      filteredServices = filteredServices.filter(service => 
        service.name.toLowerCase().includes(query) || 
        (service.description && service.description.toLowerCase().includes(query))
      );
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

  return (
    <DayViewContainer>
      <DayViewHeader>
        <Box display="flex" alignItems="center">
          <IconButton onClick={handlePrevDay}>
            <ChevronLeft />
          </IconButton>
          <Typography variant="h6" sx={{ mx: 2 }}>
            {format(currentDate, 'EEEE, MMMM d, yyyy')}
          </Typography>
          <IconButton onClick={handleNextDay}>
            <ChevronRight />
          </IconButton>
          <Tooltip title="Today">
            <IconButton onClick={handleToday} sx={{ ml: 1 }}>
              <Today />
            </IconButton>
          </Tooltip>
        </Box>
      </DayViewHeader>
      
      <ScheduleGrid>
        {renderTimeColumn()}
        
        {/* Stylist columns */}
        {stylists.map(stylist => (
          <StylistColumn key={stylist.id}>
            <StylistHeader
              onClick={() => handleBreakDialogOpen(stylist.id)}
              sx={{
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: theme.palette.salon.oliveLight,
                  opacity: 0.9
                }
              }}
            >
              <Typography variant="subtitle2">{stylist.name}</Typography>
            </StylistHeader>
            
            {/* Time slots for booking */}
            {timeSlots.map(slot => (
              <AppointmentSlot
                key={`slot-${stylist.id}-${slot.hour}-${slot.minute}`}
                onClick={() => handleSlotClick(stylist.id, slot.hour, slot.minute)}
                onDragOver={(e) => handleDragOver(e, stylist.id, slot.hour, slot.minute)}
                onDrop={(e) => handleDrop(e, stylist.id, slot.hour, slot.minute)}
                sx={isBreakTime(stylist.id, slot.hour, slot.minute) ? { 
                  backgroundColor: 'transparent', // Completely transparent
                  cursor: 'not-allowed',
                  pointerEvents: 'none', // Prevent mouse events
                  '&:hover': {
                    backgroundColor: 'transparent' // No hover effect
                  }
                } : undefined}
              />
            ))}
            
            {/* Appointments */}
            {todayAppointments
              .filter(appointment => appointment.stylist_id === stylist.id)
              .map(appointment => {
                const service = services.find(s => s.id === appointment.service_id);
                const top = getAppointmentPosition(appointment.start_time);
                const duration = getAppointmentDuration(appointment.start_time, appointment.end_time);
                
                // Create normalized dates for display to ensure correct time formatting
                const startTimeDate = normalizeDateTime(appointment.start_time);
                const endTimeDate = normalizeDateTime(appointment.end_time);
                
                return (
                  <AppointmentCard
                    key={appointment.id}
                    duration={duration}
                    style={{ top }}
                    onClick={(e) => {
                      // Prevent click when dragging is finished
                      if (!draggedAppointment) {
                        handleAppointmentClick(appointment);
                      }
                    }}
                    draggable
                    onDragStart={(e) => handleDragStart(e, appointment)}
                  >
                    <Typography variant="caption" fontWeight="bold">
                      {appointment.clients?.full_name || 'Unknown'}
                    </Typography>
                    <Typography variant="caption">
                      {service?.name || 'Unknown Service'}
                    </Typography>
                    <Typography variant="caption">
                      {format(startTimeDate, 'h:mm a')} - {format(endTimeDate, 'h:mm a')}
                    </Typography>
                  </AppointmentCard>
                );
              })}
            
            {/* Stylist Breaks */}
            {getStylistBreaks(stylist.id).map((breakItem: StylistBreak) => {
              const breakDate = new Date(breakItem.startTime);
              // Only show breaks for the current day
              if (!isSameDay(breakDate, currentDate)) return null;
              
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

              return (
                <BreakBlock
                  key={breakItem.id}
                  sx={{
                    top: `${top}px`,
                    height: `${height}px`,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-start',
                    gap: 0.5
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>
                    Break Time
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                    {format(breakStartTime, 'h:mm a')} - {format(breakEndTime, 'h:mm a')}
                  </Typography>
                  {breakItem.reason && (
                    <Typography variant="caption" sx={{ fontSize: '0.7rem', opacity: 0.9 }}>
                      {breakItem.reason}
                    </Typography>
                  )}
                </BreakBlock>
              );
            })}
          </StylistColumn>
        ))}
      </ScheduleGrid>
      
      {/* Edit Appointment Dialog */}
      <Dialog open={editDialogOpen} onClose={handleEditDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Appointment</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Client Name"
                value={editFormData.clientName}
                onChange={(e) => setEditFormData({ ...editFormData, clientName: e.target.value })}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Mobile Number"
                value={editFormData.mobileNumber}
                onChange={(e) => setEditFormData({ ...editFormData, mobileNumber: e.target.value })}
                fullWidth
                placeholder="Enter client's mobile number"
                InputProps={{
                  startAdornment: (
                    <Box component="span" sx={{ color: 'text.secondary', mr: 1 }}>
                      +
                    </Box>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Service Selection
              </Typography>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel id="edit-service-collection-label">Service Collection</InputLabel>
                    <Select
                      labelId="edit-service-collection-label"
                      value={selectedServiceCollection}
                      onChange={(e) => setSelectedServiceCollection(e.target.value as string)}
                      label="Service Collection"
                    >
                      <MenuItem value="">
                        <em>All Collections</em>
                      </MenuItem>
                      {serviceCollections?.map((collection) => (
                        <MenuItem key={collection.id} value={collection.id}>
                          {collection.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Search services..."
                    value={serviceSearchQuery}
                    onChange={(e) => setServiceSearchQuery(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              </Grid>
              
              {/* Selected Service Display */}
              {editFormData.serviceId && (
                <Box 
                  sx={{ 
                    mb: 2, 
                    p: 2, 
                    border: '1px solid', 
                    borderColor: 'success.main', 
                    borderRadius: 1,
                    bgcolor: 'success.light',
                    color: 'success.contrastText'
                  }}
                >
                  <Typography variant="subtitle1" fontWeight="bold">
                    Selected Service:
                  </Typography>
                  <Typography>
                    {services?.find(s => s.id === editFormData.serviceId)?.name} - {' '}
                    {services?.find(s => s.id === editFormData.serviceId)?.duration} min - {' '}
                    {formatCurrency(services?.find(s => s.id === editFormData.serviceId)?.price || 0)}
                  </Typography>
                </Box>
              )}
              
              {/* Service Cards */}
              <Box sx={{ maxHeight: '300px', overflow: 'auto', mb: 2 }}>
                <Grid container spacing={1}>
                  {getFilteredServices().length > 0 ? (
                    getFilteredServices().map((service) => (
                      <Grid item xs={12} sm={6} key={service.id}>
                        <Paper 
                          elevation={editFormData.serviceId === service.id ? 3 : 1}
                          sx={{ 
                            p: 1.5, 
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            border: editFormData.serviceId === service.id ? '2px solid' : '1px solid',
                            borderColor: editFormData.serviceId === service.id ? 'primary.main' : 'divider',
                            bgcolor: editFormData.serviceId === service.id ? 'rgba(25, 118, 210, 0.08)' : 'background.paper',
                            '&:hover': {
                              bgcolor: 'action.hover',
                              transform: 'translateY(-2px)',
                              boxShadow: 2
                            }
                          }}
                          onClick={() => setEditFormData({ ...editFormData, serviceId: service.id })}
                        >
                          <Typography variant="subtitle1" fontWeight="medium">
                            {service.name}
                          </Typography>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              {service.duration} min
                            </Typography>
                            <Typography variant="body1" fontWeight="bold">
                              {formatCurrency(service.price)}
                            </Typography>
                          </Box>
                          {service.description && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                              {service.description}
                            </Typography>
                          )}
                        </Paper>
                      </Grid>
                    ))
                  ) : (
                    <Grid item xs={12}>
                      <Alert severity="info">
                        No services found. Try adjusting your search or selecting a different collection.
                      </Alert>
                    </Grid>
                  )}
                </Grid>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth required>
                <InputLabel>Start Time</InputLabel>
                <Select
                  value={editFormData.startTime}
                  onChange={(e) => handleTimeChange(e, 'startTime')}
                  label="Start Time"
                >
                  {timeOptions.map((option) => (
                    <MenuItem key={`start-${option.value}`} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth required>
                <InputLabel>End Time</InputLabel>
                <Select
                  value={editFormData.endTime}
                  onChange={(e) => handleTimeChange(e, 'endTime')}
                  label="End Time"
                >
                  {timeOptions.map((option) => (
                    <MenuItem key={`end-${option.value}`} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Notes"
                value={editFormData.notes}
                onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                multiline
                rows={3}
                fullWidth
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          {onDeleteAppointment && (
            <Button onClick={handleDeleteAppointment} color="error" sx={{ mr: 'auto' }}>
              Delete
            </Button>
          )}
          <Button 
            onClick={handleCreateBill}
            color="success"
            startIcon={<Receipt />}
          >
            Create Bill
          </Button>
          <Button onClick={handleEditDialogClose}>Cancel</Button>
          <Button onClick={handleUpdateAppointment} variant="contained" color="primary">
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Break Dialog */}
      <Dialog open={breakDialogOpen} onClose={handleBreakDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>Add Break Time</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <FormControl fullWidth required>
                <InputLabel>Start Time</InputLabel>
                <Select
                  value={breakFormData.startTime}
                  onChange={(e) => setBreakFormData({ ...breakFormData, startTime: e.target.value as string })}
                  label="Start Time"
                >
                  {timeOptions.map((option) => (
                    <MenuItem key={`break-start-${option.value}`} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth required>
                <InputLabel>End Time</InputLabel>
                <Select
                  value={breakFormData.endTime}
                  onChange={(e) => setBreakFormData({ ...breakFormData, endTime: e.target.value as string })}
                  label="End Time"
                >
                  {timeOptions.map((option) => (
                    <MenuItem key={`break-end-${option.value}`} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Reason"
                value={breakFormData.reason}
                onChange={(e) => setBreakFormData({ ...breakFormData, reason: e.target.value })}
                fullWidth
                placeholder="Optional: Enter reason for break"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleBreakDialogClose}>Cancel</Button>
          <Button onClick={handleAddBreak} variant="contained" color="primary">
            Add Break
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar 
        open={snackbarOpen} 
        autoHideDuration={4000} 
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity="warning">
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </DayViewContainer>
  );
} 