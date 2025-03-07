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
  Alert
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { ChevronLeft, ChevronRight, Today, Receipt } from '@mui/icons-material';
import { format, addDays, isSameDay } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useClients } from '../hooks/useClients';
import { StylistBreak } from '../hooks/useStylists';

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

const TIME_SLOT_HEIGHT = 60; // Height in pixels for a 30-minute slot

// Styled components
const DayViewContainer = styled(Paper)(({ theme }) => ({
  height: 'calc(100vh - 120px)',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  backgroundColor: theme.palette.background.default, // Off-white background
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: 28, // Increased border radius for main container
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
  width: 80,
  flexShrink: 0,
  borderRight: `1px solid ${theme.palette.divider}`,
  position: 'sticky',
  left: 0,
  backgroundColor: theme.palette.background.paper, // White background
  zIndex: 2,
}));

const StylistColumn = styled(Box)(({ theme }) => ({
  flex: 1,
  minWidth: 180,
  borderRight: `1px solid ${theme.palette.divider}`,
  position: 'relative',
  backgroundColor: theme.palette.salon.offWhite, // Off-white background
}));

const StylistHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1),
  textAlign: 'center',
  borderBottom: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.salon.oliveLight, // Light olive background
  color: theme.palette.common.white, // White text for contrast
  position: 'sticky',
  top: 0,
  zIndex: 1,
  fontWeight: 600,
  borderRadius: '16px 16px 0 0', // Rounded top corners
}));

const TimeSlot = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isHalfHour',
})<{ isHalfHour: boolean }>(({ theme, isHalfHour }) => ({
  height: TIME_SLOT_HEIGHT / 2,
  borderBottom: `1px solid ${isHalfHour ? theme.palette.divider : theme.palette.grey[200]}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  paddingRight: theme.spacing(1),
  color: theme.palette.text.secondary,
  fontSize: '0.75rem',
  backgroundColor: isHalfHour ? 'transparent' : theme.palette.salon.cream, // Cream background for full hours
}));

const AppointmentSlot = styled(Box)(({ theme }) => ({
  height: TIME_SLOT_HEIGHT / 2,
  borderBottom: `1px solid ${theme.palette.divider}`,
  cursor: 'pointer',
  transition: 'background-color 0.2s',
  '&:hover': {
    backgroundColor: `${theme.palette.primary.light}20`, // Light olive with transparency
  },
}));

const AppointmentCard = styled(Box)<{ duration: number }>(({ theme, duration }) => ({
  position: 'absolute',
  left: theme.spacing(0.5),
  right: theme.spacing(0.5),
  height: (duration / 30) * (TIME_SLOT_HEIGHT / 2), // Convert duration to height
  backgroundColor: theme.palette.primary.main, // Olive green from theme
  color: theme.palette.primary.contrastText, // White text for contrast
  borderRadius: 8, // Less rounded corners to prevent text from being hidden
  padding: theme.spacing(0.75, 1), // Slightly more padding for text
  overflow: 'hidden',
  boxShadow: '0px 4px 12px rgba(107, 142, 35, 0.25)', // Enhanced shadow
  zIndex: 1,
  fontSize: '0.75rem',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  transition: 'all 0.2s ease-in-out',
  cursor: 'move', // Cursor indicating it's draggable
  border: '1px solid rgba(255, 255, 255, 0.25)', // Slightly more visible border
  '&:hover': {
    boxShadow: '0px 6px 16px rgba(107, 142, 35, 0.4)',
    transform: 'translateY(-2px)', // Removed scale to prevent text clipping
  },
}));

const BreakCard = styled(Box)<{ duration: number }>(({ theme, duration }) => ({
  position: 'absolute',
  left: theme.spacing(0.5),
  right: theme.spacing(0.5),
  height: (duration / 30) * (TIME_SLOT_HEIGHT / 2), // Convert duration to height
  backgroundColor: theme.palette.error.light, // Light red for breaks
  color: theme.palette.error.contrastText, 
  borderRadius: 8,
  padding: theme.spacing(0.75, 1),
  overflow: 'hidden',
  boxShadow: '0px 4px 12px rgba(211, 47, 47, 0.25)',
  zIndex: 1,
  fontSize: '0.75rem',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  transition: 'all 0.2s ease-in-out',
  border: '1px solid rgba(255, 255, 255, 0.25)',
  cursor: 'default', // Not draggable
  '&:hover': {
    boxShadow: '0px 6px 16px rgba(211, 47, 47, 0.4)',
  },
}));

// Generate time slots for the day
const generateTimeSlots = () => {
  const slots = [];
  for (let hour = BUSINESS_HOURS.start; hour <= BUSINESS_HOURS.end; hour++) {
    // Add hour slot
    slots.push({ hour, minute: 0 });
    // Add half-hour slot
    if (hour < BUSINESS_HOURS.end) {
      slots.push({ hour, minute: 30 });
    }
  }
  return slots;
};

// Generate time options for select dropdown
const generateTimeOptions = () => {
  const options = [];
  for (let hour = BUSINESS_HOURS.start; hour <= BUSINESS_HOURS.end; hour++) {
    // Convert to 12-hour format with AM/PM
    const period = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
    
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
}

export default function StylistDayView({
  stylists,
  appointments,
  services,
  selectedDate,
  onSelectTimeSlot,
  onUpdateAppointment,
  onDeleteAppointment,
}: StylistDayViewProps) {
  const [currentDate, setCurrentDate] = useState<Date>(selectedDate || new Date());
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState<boolean>(false);
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
  
  // Calculate position for an appointment
  const getAppointmentPosition = (startTime: string) => {
    const time = new Date(startTime);
    const hour = time.getHours();
    const minute = time.getMinutes();
    
    // Calculate slots from the start of business hours
    const hourOffset = hour - BUSINESS_HOURS.start;
    const minuteOffset = minute / 30; // Convert minutes to 30-minute slots
    
    return (hourOffset * 2 + minuteOffset) * (TIME_SLOT_HEIGHT / 2);
  };
  
  // Calculate duration in 30-minute slots
  const getAppointmentDuration = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationMs = end.getTime() - start.getTime();
    const durationMinutes = durationMs / (1000 * 60);
    
    return durationMinutes;
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

  // Check if a time slot conflicts with any stylist break
  const isBreakTime = (stylistId: string, hour: number, minute: number) => {
    const stylist = stylists.find(s => s.id === stylistId);
    if (!stylist || !stylist.breaks || stylist.breaks.length === 0) {
      return false;
    }
    
    const slotTime = new Date(currentDate);
    slotTime.setHours(hour, minute, 0, 0);
    const slotTimeValue = slotTime.getTime();
    
    return stylist.breaks.some((breakItem: StylistBreak) => {
      const breakStart = new Date(breakItem.startTime).getTime();
      const breakEnd = new Date(breakItem.endTime).getTime();
      
      return slotTimeValue >= breakStart && slotTimeValue < breakEnd;
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
      const breakDate = new Date(breakItem.startTime);
      return (
        breakDate.getFullYear() === currentDate.getFullYear() &&
        breakDate.getMonth() === currentDate.getMonth() &&
        breakDate.getDate() === currentDate.getDate()
      );
    });
  };

  // Add state for snackbar
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Add handleSnackbarClose function
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
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
        {/* Time column */}
        <TimeColumn>
          <StylistHeader>
            <Typography variant="subtitle2">Time</Typography>
          </StylistHeader>
          
          {timeSlots.map((slot, index) => (
            <TimeSlot 
              key={`time-${slot.hour}-${slot.minute}`}
              isHalfHour={slot.minute === 30}
            >
              {slot.minute === 0 && formatHour(slot.hour)}
            </TimeSlot>
          ))}
        </TimeColumn>
        
        {/* Stylist columns */}
        {stylists.map(stylist => (
          <StylistColumn key={stylist.id}>
            <StylistHeader>
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
                  backgroundColor: 'rgba(211, 47, 47, 0.1)', 
                  cursor: 'not-allowed',
                  '&:hover': {
                    backgroundColor: 'rgba(211, 47, 47, 0.15)'
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
                      {formatTime(new Date(appointment.start_time))} - 
                      {formatTime(new Date(appointment.end_time))}
                    </Typography>
                  </AppointmentCard>
                );
              })}
            
            {/* Stylist Breaks */}
            {getStylistBreaks(stylist.id).map((breakItem: StylistBreak) => {
              const top = getAppointmentPosition(breakItem.startTime);
              const duration = getAppointmentDuration(breakItem.startTime, breakItem.endTime);
              
              return (
                <BreakCard
                  key={`break-${breakItem.id}`}
                  duration={duration}
                  style={{ top }}
                >
                  <Typography variant="caption" fontWeight="bold">
                    Break Time
                  </Typography>
                  {breakItem.reason && (
                    <Typography variant="caption">
                      {breakItem.reason}
                    </Typography>
                  )}
                  <Typography variant="caption">
                    {formatTime(new Date(breakItem.startTime))} - 
                    {formatTime(new Date(breakItem.endTime))}
                  </Typography>
                </BreakCard>
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