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
  useMediaQuery
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { 
  ChevronLeft, 
  ChevronRight, 
  Today, 
  Receipt, 
  Search, 
  Clear, 
  CalendarMonth,
  Coffee,
  Timer
} from '@mui/icons-material';
import { format, addDays, isSameDay } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useClients } from '../hooks/useClients';
import { StylistBreak } from '../hooks/useStylists';
import GoogleCalendarSync from './GoogleCalendarSync';
import { useAppointments } from '../hooks/useAppointments';
import { googleCalendarService } from '../services/googleCalendarService';

// Define the time slots for the day with 30-minute intervals
const BUSINESS_HOURS = {
  start: 8,  // 8 AM
  end: 20,   // 8 PM
};

// Define time slot heights for 30-minute intervals
const TIME_SLOT_HEIGHT = 40; // Height for each 30-minute slot
const HOUR_HEIGHT = TIME_SLOT_HEIGHT * 2; // Height for a full hour (2 x 30-minute slots)

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
  padding: theme.spacing(0.5),
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
const AppointmentCard = styled(Box)<{ duration: number }>(({ theme, duration }) => ({
  position: 'absolute',
  left: theme.spacing(0.5),
  right: theme.spacing(0.5),
  height: `${duration}px`,
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  borderRadius: '4px',
  padding: theme.spacing(0.5, 1),
  overflow: 'hidden',
  boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1)',
  zIndex: 5,
  fontSize: '0.85rem',
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
const BreakCard = styled(Box)<{ duration: number }>(({ theme, duration }) => ({
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

// Improved time formatting with options for 12-hour or 24-hour format
const formatTime = (date: Date, use24Hour = false): string => {
  if (use24Hour) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  }
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
};

// Generate time slots with 30-minute intervals
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

// Improved normalize date function for consistent time handling
const normalizeDateTime = (dateTimeString: string, currentDateObj: Date) => {
  // Parse the input date string
  const dateTime = new Date(dateTimeString);
  
  // Create a new date object with the current date but the appointment's time
  const normalized = new Date(
    currentDateObj.getFullYear(),
    currentDateObj.getMonth(),
    currentDateObj.getDate(),
    dateTime.getHours(),
    dateTime.getMinutes(),
    0,
    0
  );
  
  return normalized;
};

// Update the getAppointmentPosition function to use the new time slot height
const getAppointmentPosition = (startTime: string, currentDateObj: Date) => {
  const startDate = normalizeDateTime(startTime, currentDateObj);
  const businessStartHour = BUSINESS_HOURS.start;
  
  // Calculate hours and minutes from the start of business hours
  const hours = startDate.getHours() - businessStartHour;
  const minutes = startDate.getMinutes();
  
  // Calculate position based on hours and minutes
  // Each hour is HOUR_HEIGHT pixels, each minute is HOUR_HEIGHT/60 pixels
  const position = (hours * HOUR_HEIGHT) + (minutes * (HOUR_HEIGHT / 60));
  
  return position;
};

// Update the getAppointmentDuration function to use the new time slot height
const getAppointmentDuration = (startTime: string, endTime: string, currentDateObj: Date) => {
  const startDate = normalizeDateTime(startTime, currentDateObj);
  const endDate = normalizeDateTime(endTime, currentDateObj);
  
  // Calculate duration in minutes
  const durationMinutes = (endDate.getTime() - startDate.getTime()) / (1000 * 60);
  
  // Convert minutes to pixels (each minute is HOUR_HEIGHT/60 pixels)
  const durationPixels = durationMinutes * (HOUR_HEIGHT / 60);
  
  // Ensure minimum height for very short appointments
  return Math.max(durationPixels, TIME_SLOT_HEIGHT / 2);
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
  const navigate = useNavigate();
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
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
  
  // Track expanded appointment for detail view
  const [expandedAppointment, setExpandedAppointment] = useState<string | null>(null);
  
  // Add search functionality
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  
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
  
  const handleTomorrow = () => {
    setCurrentDate(addDays(new Date(), 1));
  };
  
  // Filter appointments based on search query
  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    
    setIsSearching(true);
    
    // Search through all appointments
    const results = appointments.filter(appointment => {
      const clientName = appointment.clients?.full_name || '';
      const serviceName = services.find(s => s.id === appointment.service_id)?.name || '';
      const notes = appointment.notes || '';
      
      // Try to parse as date if it looks like a date
      let searchDate = null;
      if (searchQuery.includes('/') || searchQuery.includes('-')) {
        searchDate = new Date(searchQuery);
      }
      
      // Check if appointmentDate matches search date (if search is a valid date)
      let dateMatches = false;
      if (searchDate && !isNaN(searchDate.getTime())) {
        const appointmentDate = new Date(appointment.start_time);
        dateMatches = (
          appointmentDate.getFullYear() === searchDate.getFullYear() &&
          appointmentDate.getMonth() === searchDate.getMonth() &&
          appointmentDate.getDate() === searchDate.getDate()
        );
      }
      
      // Match by client name, service name, notes or date
      return (
        clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        serviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notes.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dateMatches
      );
    });
    
    setSearchResults(results);
  };
  
  // Clear search
  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setIsSearching(false);
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

  // Handle opening the edit dialog for an appointment
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
    
    setEditDialogOpen(true);
  };

  // Handle appointment click to expand/collapse details
  const toggleAppointmentDetails = (appointmentId: string) => {
    if (expandedAppointment === appointmentId) {
      setExpandedAppointment(null); // Collapse if already expanded
    } else {
      setExpandedAppointment(appointmentId); // Expand this appointment
    }
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
        const start1 = normalizeDateTime(appt1.start_time, currentDate).getTime();
        const end1 = normalizeDateTime(appt1.end_time, currentDate).getTime();
        
        for (let j = i + 1; j < stylistAppointments.length; j++) {
          const appt2 = stylistAppointments[j];
          const start2 = normalizeDateTime(appt2.start_time, currentDate).getTime();
          const end2 = normalizeDateTime(appt2.end_time, currentDate).getTime();
          
          // Check if appointments overlap
          if ((start1 < end2 && end1 > start2)) {
            conflicts.push([appt1.id, appt2.id]);
          }
        }
      }
    });
    
    return conflicts;
  };
  
  // Get all appointments for today
  const todayAppointments = appointments.filter(appointment => {
    const appointmentDate = new Date(appointment.start_time);
    return isSameDay(appointmentDate, currentDate);
  });
  
  // Find conflicting appointments
  const conflicts = checkForConflicts();
  
  // Function to check if an appointment has conflicts
  const hasConflict = (appointmentId: string) => {
    return conflicts.some(conflict => conflict.includes(appointmentId));
  };

  // Snackbar close handler
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
          breaks: todayBreaks.map(b => ({
            id: b.id,
            startTime: new Date(b.startTime).toLocaleTimeString(),
            endTime: new Date(b.endTime).toLocaleTimeString(),
            normalizedStart: normalizeDateTime(b.startTime, currentDate).toLocaleTimeString(),
            normalizedEnd: normalizeDateTime(b.endTime, currentDate).toLocaleTimeString()
          }))
        });
      }
      
      // Check if any break overlaps with this time slot
      return todayBreaks.some((breakItem: StylistBreak) => {
        try {
          // Use normalized times for consistent handling
          const breakStart = normalizeDateTime(breakItem.startTime, currentDate).getTime();
          const breakEnd = normalizeDateTime(breakItem.endTime, currentDate).getTime();
          
          // Check for any overlap between the slot and the break
          const isOverlapping = 
            (breakStart <= slotTimeValue && breakEnd > slotTimeValue) || // Break starts before/at slot and ends after slot start
            (breakStart >= slotTimeValue && breakStart < slotEndTimeValue); // Break starts during the slot
          
          return isOverlapping;
        } catch (error) {
          console.error('Error checking break overlap:', error);
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

  // Render time column with 30-minute intervals
  const renderTimeColumn = () => {
    const timeSlots = generateTimeSlots();
    
    return (
      <TimeColumn>
        <StylistHeader>Time</StylistHeader>
        {timeSlots.map(({ hour, minute }, index) => {
          const timeDate = new Date();
          timeDate.setHours(hour, minute, 0, 0);
          
          // Only show time label for the start of each hour and hide the 30-minute marker
          const showLabel = minute === 0;
          
          return (
            <HourLabel 
              key={`time-${hour}-${minute}`} 
              sx={{ 
                height: TIME_SLOT_HEIGHT,
                borderBottom: minute === 30 ? '1px dashed rgba(0, 0, 0, 0.08)' : '1px solid rgba(0, 0, 0, 0.1)',
                fontWeight: minute === 0 ? 'medium' : 'normal',
                color: minute === 0 ? 'text.secondary' : 'text.disabled',
                fontSize: minute === 0 ? '0.75rem' : '0.7rem',
                // Position the time label to the left of the grid line
                '& span': {
                  position: 'relative',
                  top: minute === 0 ? '-9px' : '0',
                }
              }}
            >
              {showLabel && <span>{formatTime(timeDate)}</span>}
            </HourLabel>
          );
        })}
      </TimeColumn>
    );
  };

  // Render appointments with expandable details
  const renderAppointments = (stylistId: string) => {
    // Filter appointments for this stylist on the current day
    let stylistAppointments = appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.start_time);
      return appointment.stylist_id === stylistId && 
             isSameDay(appointmentDate, currentDate);
    });
    
    // If searching, only show search results for this stylist
    if (isSearching) {
      stylistAppointments = stylistAppointments.filter(appointment => 
        searchResults.some(result => result.id === appointment.id)
      );
    }

    return (
      <>
        {stylistAppointments.map(appointment => {
          const service = services.find(s => s.id === appointment.service_id);
          const top = getAppointmentPosition(appointment.start_time, currentDate);
          const duration = getAppointmentDuration(appointment.start_time, appointment.end_time, currentDate);
          
          // Format times for display
          const startTimeDate = normalizeDateTime(appointment.start_time, currentDate);
          const endTimeDate = normalizeDateTime(appointment.end_time, currentDate);
          const formattedStartTime = formatTime(startTimeDate);
          const formattedEndTime = formatTime(endTimeDate);
          
          // Check if this appointment is expanded
          const isExpanded = expandedAppointment === appointment.id;
          
          // Calculate if this appointment doesn't align with 30-minute intervals
          const startMinutes = startTimeDate.getMinutes();
          const endMinutes = endTimeDate.getMinutes();
          const isNonStandardTime = (startMinutes % 30 !== 0) || (endMinutes % 30 !== 0);
          
          // Check if this appointment has conflicts
          const appointmentHasConflict = hasConflict(appointment.id);
          
          // Check if this appointment is synced with Google Calendar
          const isSyncedWithGoogleCalendar = !!appointment.googleCalendarId;
          
          return (
            <AppointmentCard
              key={appointment.id}
              duration={duration}
              style={{ top: `${top}px` }}
              onClick={() => toggleAppointmentDetails(appointment.id)}
              sx={{
                zIndex: isExpanded ? 10 : 5,
                transition: 'all 0.3s ease',
                transform: isExpanded ? 'scale(1.05)' : 'scale(1)',
                boxShadow: isExpanded ? '0 8px 16px rgba(0,0,0,0.2)' : '0 3px 8px rgba(0,0,0,0.15)',
                height: isExpanded ? 'auto' : undefined,
                minHeight: `${duration}px`,
                border: appointmentHasConflict ? '2px solid #ff0000' : 
                        isNonStandardTime ? '2px dashed rgba(255,255,0,0.5)' : 
                        '1px solid rgba(255,255,255,0.15)',
                backgroundColor: appointmentHasConflict ? 
                                 'rgba(255, 0, 0, 0.15)' : 
                                 theme.palette.primary.main,
              }}
            >
              <Typography variant="subtitle2" fontWeight="bold" noWrap>
                {appointment.clients?.full_name || 'Unknown Client'}
              </Typography>
              
              <Typography variant="caption" sx={{ mb: 0.5 }}>
                {service?.name || 'Unknown Service'}
              </Typography>
              
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between'
              }}>
                <Typography variant="caption" sx={{ 
                  display: 'inline-block', 
                  backgroundColor: 'rgba(0,0,0,0.1)', 
                  padding: '2px 4px',
                  borderRadius: '2px',
                  fontSize: '0.75rem'
                }}>
                  {formattedStartTime} - {formattedEndTime}
                </Typography>
                
                {isSyncedWithGoogleCalendar && (
                  <Tooltip title="Synced with Google Calendar">
                    <CalendarMonth 
                      fontSize="small" 
                      sx={{ 
                        color: 'rgba(255,255,255,0.8)', 
                        fontSize: '0.9rem',
                        ml: 0.5
                      }} 
                    />
                  </Tooltip>
                )}
              </Box>
              
              {appointmentHasConflict && !isExpanded && (
                <Typography variant="caption" sx={{ 
                  display: 'block', 
                  color: 'red',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  padding: '2px 4px',
                  borderRadius: '2px',
                  mt: 0.5,
                  fontWeight: 'bold',
                  fontSize: '0.75rem'
                }}>
                  ⚠️ Schedule Conflict
                </Typography>
              )}
              
              {isExpanded && (
                <Box sx={{ mt: 1, pt: 1, borderTop: '1px dashed rgba(255,255,255,0.3)' }}>
                  <Typography variant="caption" sx={{ display: 'block', fontWeight: 'bold' }}>
                    Appointment Details:
                  </Typography>
                  
                  {isNonStandardTime && (
                    <Typography variant="caption" sx={{ 
                      display: 'block', 
                      color: 'yellow',
                      backgroundColor: 'rgba(0,0,0,0.2)',
                      padding: '4px',
                      borderRadius: '2px',
                      mt: 0.5
                    }}>
                      ⚠️ Non-standard time slot - Consider adjusting to align with 30-minute intervals
                    </Typography>
                  )}
                  
                  {appointmentHasConflict && (
                    <Typography variant="caption" sx={{ 
                      display: 'block', 
                      color: 'red',
                      backgroundColor: 'rgba(0,0,0,0.2)',
                      padding: '4px',
                      borderRadius: '2px',
                      mt: 0.5,
                      fontWeight: 'bold'
                    }}>
                      ⚠️ CONFLICT: This appointment overlaps with another
                    </Typography>
                  )}
                  
                  <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                    Duration: {Math.round(duration / TIME_SLOT_HEIGHT * 30)} minutes
                  </Typography>
                  
                  {appointment.clients?.phone && (
                    <Typography variant="caption" sx={{ display: 'block' }}>
                      Phone: {appointment.clients.phone}
                    </Typography>
                  )}
                  
                  {appointment.notes && (
                    <Typography variant="caption" sx={{ display: 'block' }}>
                      Notes: {appointment.notes}
                    </Typography>
                  )}
                  
                  {/* Google Calendar status */}
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    mt: 0.5,
                    backgroundColor: isSyncedWithGoogleCalendar ? 'rgba(25, 118, 210, 0.1)' : 'transparent',
                    padding: '4px',
                    borderRadius: '2px',
                  }}>
                    {isSyncedWithGoogleCalendar ? (
                      <>
                        <CalendarMonth fontSize="small" color="primary" sx={{ mr: 0.5 }} />
                        <Typography variant="caption" color="primary">
                          Synced with Google Calendar
                        </Typography>
                      </>
                    ) : (
                      <>
                        <CalendarMonth fontSize="small" color="action" sx={{ mr: 0.5, opacity: 0.5 }} />
                        <Typography variant="caption" color="text.secondary">
                          Not synced with Google Calendar
                        </Typography>
                      </>
                    )}
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Button 
                      size="small" 
                      variant="contained" 
                      color="primary" 
                      sx={{ fontSize: '0.7rem', py: 0.25 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        // Use the existing edit function
                        handleAppointmentClick(appointment);
                        // Close the expanded view
                        setExpandedAppointment(null);
                      }}
                    >
                      Edit
                    </Button>
                    
                    {!isSyncedWithGoogleCalendar && (
                      <Button 
                        size="small"
                        variant="outlined"
                        color="primary"
                        sx={{ fontSize: '0.7rem', py: 0.25 }}
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            const stylist = stylists.find(s => s.id === appointment.stylist_id);
                            const calendarId = await googleCalendarService.syncAppointment(
                              appointment,
                              service,
                              stylist
                            );
                            await handleSyncComplete(appointment.id, calendarId);
                          } catch (error) {
                            console.error('Error syncing appointment:', error);
                            setSnackbarMessage('Failed to sync appointment with Google Calendar');
                            setSnackbarOpen(true);
                          }
                        }}
                      >
                        Sync to Calendar
                      </Button>
                    )}
                    
                    <Button 
                      size="small" 
                      variant="outlined" 
                      color="error" 
                      sx={{ fontSize: '0.7rem', py: 0.25 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        // Use the existing delete function
                        setSelectedAppointment(appointment);
                        setDeleteDialogOpen(true);
                        // Close the expanded view
                        setExpandedAppointment(null);
                      }}
                    >
                      Cancel
                    </Button>
                  </Box>
                </Box>
              )}
            </AppointmentCard>
          );
        })}
      </>
    );
  };

  // Render time grid with 30-minute intervals
  const renderTimeGrid = () => {
    const slots = [];
    for (let hour = BUSINESS_HOURS.start; hour <= BUSINESS_HOURS.end; hour++) {
      // Add hour marker (solid line)
      const hourPosition = (hour - BUSINESS_HOURS.start) * HOUR_HEIGHT;
      slots.push(
        <Box
          key={`grid-hour-${hour}`}
          sx={{
            position: 'absolute',
            top: hourPosition,
            left: 0,
            right: 0,
            height: TIME_SLOT_HEIGHT,
            backgroundColor: (theme) => 
              hour % 2 === 0 ? 
              'rgba(0, 0, 0, 0.01)' : 
              'rgba(0, 0, 0, 0.02)',
            borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
            zIndex: 1,
          }}
        />
      );
      
      // Add 30-minute marker (dashed line)
      if (hour < BUSINESS_HOURS.end) {
        slots.push(
          <Box
            key={`grid-${hour}-30`}
            sx={{
              position: 'absolute',
              top: hourPosition + TIME_SLOT_HEIGHT,
              left: 0,
              right: 0,
              height: TIME_SLOT_HEIGHT,
              backgroundColor: 'transparent',
              borderBottom: '1px dashed rgba(0, 0, 0, 0.05)',
              zIndex: 1
            }}
          />
        );
      }
    }
    
    return slots;
  };

  // Improved function to render a stylist column with better time slot interaction
  const renderStylistColumn = (stylist: any) => {
    const timeSlots = generateTimeSlots();
    
    return (
      <StylistColumn key={stylist.id}>
        <StylistHeader>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {stylist.name}
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="Add break">
              <IconButton 
                size="small" 
                onClick={() => handleBreakDialogOpen(stylist.id)}
                sx={{ padding: '2px' }}
              >
                <Coffee fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </StylistHeader>
        
        {/* Render time slots */}
        {timeSlots.map(({ hour, minute }) => {
          const isBreak = isBreakTime(stylist.id, hour, minute);
          
          return (
            <TimeSlot 
              key={`slot-${stylist.id}-${hour}-${minute}`}
              onClick={() => handleSlotClick(stylist.id, hour, minute)}
              onDragOver={(e) => handleDragOver(e, stylist.id, hour, minute)}
              onDrop={(e) => handleDrop(e, stylist.id, hour, minute)}
              sx={{ 
                height: TIME_SLOT_HEIGHT,
                backgroundColor: isBreak ? 'rgba(0, 0, 0, 0.05)' : 'inherit',
                cursor: isBreak ? 'not-allowed' : 'pointer',
                borderBottom: minute === 30 ? '1px dashed rgba(0, 0, 0, 0.05)' : '1px solid rgba(0, 0, 0, 0.08)',
              }}
            />
          );
        })}
        
        {/* Render appointments */}
        {renderAppointments(stylist.id)}
      </StylistColumn>
    );
  };

  // Create a responsive navigation component
  const CalendarNavigation = () => {
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    
    return (
      <Box display="flex" alignItems="center" flexWrap="wrap" gap={1}>
        <IconButton onClick={handlePrevDay} size={isMobile ? "small" : "medium"}>
          <ChevronLeft />
        </IconButton>
        <Typography variant={isMobile ? "subtitle1" : "h6"} sx={{ 
          fontWeight: 'bold',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: isMobile ? '150px' : '300px'
        }}>
          {format(currentDate, isMobile ? 'MMM d, yyyy' : 'EEEE, MMMM d, yyyy')}
        </Typography>
        <IconButton onClick={handleNextDay} size={isMobile ? "small" : "medium"}>
          <ChevronRight />
        </IconButton>
        <Button 
          variant="outlined" 
          size="small" 
          startIcon={!isMobile && <Today />}
          onClick={handleToday}
          sx={{ ml: isMobile ? 0 : 2 }}
        >
          Today
        </Button>
        <Button 
          variant="outlined" 
          size="small" 
          onClick={handleTomorrow}
          sx={{ ml: isMobile ? 0 : 1 }}
        >
          Tomorrow
        </Button>
      </Box>
    );
  };

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

  // Add useAppointments hook to get the updateAppointmentGoogleCalendarId function
  const { updateAppointmentGoogleCalendarId } = useAppointments();

  // Handle Google Calendar sync completion
  const handleSyncComplete = async (appointmentId: string, googleCalendarId: string) => {
    try {
      await updateAppointmentGoogleCalendarId(appointmentId, googleCalendarId);
      setSnackbarMessage(`Appointment synced to Google Calendar`);
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error updating appointment with Google Calendar ID:', error);
      setSnackbarMessage('Failed to update appointment with Google Calendar ID');
      setSnackbarOpen(true);
    }
  };

  return (
    <DayViewContainer>
      <DayViewHeader>
        <CalendarNavigation />
        
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          flexWrap: 'wrap',
          width: { xs: '100%', md: 'auto' } 
        }}>
          <Tooltip title="30-minute intervals are shown. Click on an appointment to see details.">
            <Typography variant="caption" sx={{ 
              display: 'inline-block', 
              backgroundColor: 'rgba(0,0,0,0.05)', 
              padding: '4px 8px',
              borderRadius: '4px',
              mr: { xs: 0, md: 2 },
              fontSize: '0.7rem',
              whiteSpace: 'nowrap'
            }}>
              ℹ️ 30-min intervals • Click for details
            </Typography>
          </Tooltip>
          
          {/* Search bar */}
          <Box sx={{ 
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'white',
            borderRadius: '4px',
            padding: '0 8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            flexGrow: { xs: 1, md: 0 },
            width: { xs: '100%', sm: 'auto' }
          }}>
            <TextField
              placeholder="Search name, service, date..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="small"
              variant="standard"
              InputProps={{
                disableUnderline: true,
                endAdornment: searchQuery ? (
                  <IconButton size="small" onClick={handleClearSearch} sx={{ p: 0.5 }}>
                    <span role="img" aria-label="clear">✖️</span>
                  </IconButton>
                ) : null
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
              sx={{ 
                minWidth: { xs: '100%', sm: '200px', md: '250px' },
                fontSize: '0.9rem'
              }}
            />
            <IconButton onClick={handleSearch} size="small">
              <span role="img" aria-label="search">🔍</span>
            </IconButton>
          </Box>
        </Box>
      </DayViewHeader>
      
      {/* Add Google Calendar Sync Component */}
      <Box sx={{ padding: 2, borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
        <GoogleCalendarSync 
          appointments={appointments} 
          services={services}
          stylists={stylists}
          onSyncComplete={handleSyncComplete}
        />
      </Box>
      
      <DayViewContent>
        {/* Time column */}
        {renderTimeColumn()}
        
        {/* Stylist columns */}
        {stylists.map(stylist => renderStylistColumn(stylist))}
        
        {/* Empty message when search returns no results */}
        {isSearching && searchResults.length === 0 && (
          <Box sx={{ 
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            padding: 3,
            backgroundColor: 'rgba(255,255,255,0.9)',
            borderRadius: 2,
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            zIndex: 50,
            width: { xs: '80%', sm: 'auto' }
          }}>
            <Typography variant="h6">No appointments found</Typography>
            <Typography variant="body2" color="text.secondary">
              Try a different search term or clear the search
            </Typography>
            <Button 
              variant="outlined" 
              size="small" 
              onClick={handleClearSearch}
              sx={{ mt: 2 }}
            >
              Clear Search
            </Button>
          </Box>
        )}
      </DayViewContent>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity="success" sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
      
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
              <FormControl fullWidth required>
                <InputLabel>Service</InputLabel>
                <Select
                  value={editFormData.serviceId}
                  onChange={(e) => setEditFormData({ ...editFormData, serviceId: e.target.value as string })}
                  label="Service"
                >
                  {services?.map((service) => (
                    <MenuItem key={service.id} value={service.id}>
                      {service.name} - {service.duration} min
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
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
                  value={breakFormData.endTime}
                  onChange={(e) => setBreakFormData({ ...breakFormData, endTime: e.target.value as string })}
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
                label="Reason"
                value={breakFormData.reason}
                onChange={(e) => setBreakFormData({ ...breakFormData, reason: e.target.value })}
                multiline
                rows={3}
                fullWidth
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
    </DayViewContainer>
  );
}