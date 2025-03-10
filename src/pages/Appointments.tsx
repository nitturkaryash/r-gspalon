import { useState } from 'react'
import { Box, CircularProgress, Paper, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, FormControl, InputLabel, Select, MenuItem, Grid, SelectChangeEvent, Alert, Snackbar } from '@mui/material'
import { useAppointments } from '../hooks/useAppointments'
import { useServices } from '../hooks/useServices'
import { useStylists, Stylist, StylistBreak } from '../hooks/useStylists'
import StylistDayView from '../components/StylistDayView'
import { DateSelectArg } from '@fullcalendar/core'
import { toast } from 'react-toastify'
import { v4 as uuidv4 } from 'uuid'

interface BookingFormData {
  clientName: string;
  serviceId: string;
  stylistId: string;
  startTime: string;
  endTime: string;
  notes?: string;
}

// Generate time options for select dropdown
const generateTimeOptions = () => {
  const options = [];
  for (let hour = 8; hour <= 22; hour++) {
    const period = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
    
    options.push({ 
      value: `${hour}:00`, 
      label: `${hour12}:00 ${period}` 
    });
    options.push({ 
      value: `${hour}:30`, 
      label: `${hour12}:30 ${period}` 
    });
  }
  return options;
};

export default function Appointments() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<DateSelectArg | null>(null);
  const [selectedStylistId, setSelectedStylistId] = useState<string | null>(null);
  const [formData, setFormData] = useState<BookingFormData>({
    clientName: '',
    serviceId: '',
    stylistId: '',
    startTime: '',
    endTime: '',
  });

  const timeOptions = generateTimeOptions();

  const { appointments, isLoading: loadingAppointments, updateAppointment, createAppointment, deleteAppointment } = useAppointments()
  const { services, isLoading: loadingServices } = useServices()
  const { stylists, isLoading: loadingStylists, updateStylist } = useStylists()

  const handleSelect = (selectInfo: DateSelectArg) => {
    console.log('Selected slot:', selectInfo);
    
    // Check if this time overlaps with any stylist's break
    const startTime = selectInfo.start.getTime();
    const endTime = selectInfo.end.getTime();
    
    // We don't know which stylist yet, so we'll need to handle this when the stylist is selected in the form
    
    setSelectedSlot(selectInfo);
    // Reset stylist ID when selecting from calendar view
    setSelectedStylistId(null);
    
    // Format the start and end times for the time selectors
    const startDate = new Date(selectInfo.start);
    const endDate = new Date(selectInfo.end);
    
    // Update form data
    setFormData(prev => ({
      ...prev,
      stylistId: '',
      startTime: `${startDate.getHours()}:${startDate.getMinutes() === 0 ? '00' : '30'}`,
      endTime: `${endDate.getHours()}:${endDate.getMinutes() === 0 ? '00' : '30'}`,
    }));
  };

  const handleDayViewSelect = (stylistId: string, time: Date) => {
    console.log('Selected day view slot:', { stylistId, time });
    // Create a DateSelectArg-like object
    const selectInfo = {
      start: time,
      end: new Date(time.getTime() + 30 * 60000), // Add 30 minutes
      allDay: false,
    } as DateSelectArg;
    
    setSelectedSlot(selectInfo);
    setSelectedStylistId(stylistId);
    
    // Update form data with pre-selected stylist and formatted times
    setFormData(prev => ({
      ...prev,
      stylistId,
      startTime: `${time.getHours()}:${time.getMinutes() === 0 ? '00' : '30'}`,
      endTime: `${new Date(time.getTime() + 30 * 60000).getHours()}:${new Date(time.getTime() + 30 * 60000).getMinutes() === 0 ? '00' : '30'}`,
    }));
  };

  const handleTimeChange = (event: SelectChangeEvent, field: 'startTime' | 'endTime') => {
    setFormData({
      ...formData,
      [field]: event.target.value as string
    });
  };

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'error' | 'warning' | 'info' | 'success'>('error');

  const handleBookingSubmit = async () => {
    if (!selectedSlot || !formData.serviceId || !formData.clientName) {
      setSnackbarMessage('Please fill in all required fields');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    // Use either the selected stylist from day view or the one from the form
    const stylistId = selectedStylistId || formData.stylistId;
    if (!stylistId) {
      setSnackbarMessage('Please select a stylist');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    try {
      const selectedService = services?.find(s => s.id === formData.serviceId);
      if (!selectedService) throw new Error('Service not found');

      // Parse the selected times
      const [startHour, startMinute] = formData.startTime.split(':').map(Number);
      const [endHour, endMinute] = formData.endTime.split(':').map(Number);
      
      // Create Date objects for the start and end times
      const startTime = new Date(selectedSlot.start);
      startTime.setHours(startHour, startMinute, 0, 0);
      
      const endTime = new Date(selectedSlot.start);
      endTime.setHours(endHour, endMinute, 0, 0);
      
      // Ensure end time is after start time
      if (endTime <= startTime) {
        setSnackbarMessage('End time must be after start time');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        return;
      }
      
      // Check if the appointment conflicts with a stylist break
      const selectedStylist = stylists?.find(s => s.id === stylistId);
      if (selectedStylist?.breaks && selectedStylist.breaks.length > 0) {
        const appointmentStart = startTime.getTime();
        const appointmentEnd = endTime.getTime();
        
        const breakConflict = selectedStylist.breaks.some(breakItem => {
          const breakStart = new Date(breakItem.startTime).getTime();
          const breakEnd = new Date(breakItem.endTime).getTime();
          
          return (
            (appointmentStart >= breakStart && appointmentStart < breakEnd) || // Appointment starts during break
            (appointmentEnd > breakStart && appointmentEnd <= breakEnd) || // Appointment ends during break
            (appointmentStart <= breakStart && appointmentEnd >= breakEnd) // Break is within appointment
          );
        });
        
        if (breakConflict) {
          setSnackbarMessage('This appointment conflicts with a scheduled break for the stylist');
          setSnackbarSeverity('warning');
          setSnackbarOpen(true);
          return;
        }
      }

      await createAppointment({
        stylist_id: stylistId,
        service_id: formData.serviceId,
        client_name: formData.clientName,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        status: 'scheduled',
        notes: formData.notes
      });

      setSelectedSlot(null);
      setSelectedStylistId(null);
      setFormData({
        clientName: '',
        serviceId: '',
        stylistId: '',
        startTime: '',
        endTime: '',
        notes: ''
      });

      setSnackbarMessage('Appointment booked successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Failed to book appointment:', error);
      setSnackbarMessage('Failed to book appointment');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  if (loadingAppointments || loadingServices || loadingStylists) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ height: 'calc(100vh - 80px)', p: 2 }}>
      <StylistDayView
        stylists={stylists || []}
        appointments={appointments || []}
        services={services || []}
        selectedDate={selectedDate}
        onSelectTimeSlot={handleDayViewSelect}
        onUpdateAppointment={async (appointmentId, updates) => {
          try {
            await updateAppointment({
              id: appointmentId,
              ...updates
            });
            toast.success('Appointment updated successfully');
          } catch (error) {
            console.error('Failed to update appointment:', error);
            toast.error('Failed to update appointment');
            throw error;
          }
        }}
        onDeleteAppointment={async (appointmentId) => {
          try {
            await deleteAppointment(appointmentId);
            toast.success('Appointment deleted successfully');
          } catch (error) {
            console.error('Failed to delete appointment:', error);
            toast.error('Failed to delete appointment');
            throw error;
          }
        }}
        onAddBreak={async (stylistId, breakData) => {
          try {
            // Find the stylist
            const stylist = stylists?.find(s => s.id === stylistId);
            if (!stylist) {
              throw new Error('Stylist not found');
            }
            
            // Create a new break with ID
            const newBreak: StylistBreak = {
              id: uuidv4(),
              startTime: breakData.startTime,
              endTime: breakData.endTime,
              reason: breakData.reason
            };
            
            // Add the break to the stylist's breaks array
            const updatedBreaks = [...(stylist.breaks || []), newBreak];
            
            // Update the stylist with the new breaks
            await updateStylist({
              id: stylistId,
              breaks: updatedBreaks
            });
            
            toast.success('Break added successfully');
          } catch (error) {
            console.error('Failed to add break:', error);
            toast.error('Failed to add break');
            throw error;
          }
        }}
        onDateChange={(date) => {
          setSelectedDate(date);
        }}
      />

      {/* Booking Dialog */}
      <Dialog
        open={!!selectedSlot}
        onClose={() => {
          setSelectedSlot(null);
          setSelectedStylistId(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Book Appointment</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Client Name"
                value={formData.clientName}
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Stylist</InputLabel>
                <Select
                  value={selectedStylistId || formData.stylistId}
                  onChange={(e) => {
                    const value = e.target.value as string;
                    setSelectedStylistId(null); // Clear the pre-selected stylist
                    setFormData({ ...formData, stylistId: value });
                  }}
                  label="Stylist"
                  disabled={!!selectedStylistId} // Disable if stylist is pre-selected from day view
                >
                  {stylists?.map((stylist) => (
                    <MenuItem key={stylist.id} value={stylist.id}>
                      {stylist.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Service</InputLabel>
                <Select
                  value={formData.serviceId}
                  onChange={(e) => setFormData({ ...formData, serviceId: e.target.value as string })}
                  label="Service"
                >
                  {services?.map((service) => (
                    <MenuItem key={service.id} value={service.id}>
                      {service.name} - {service.duration} min - ${service.price}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth required>
                <InputLabel>Start Time</InputLabel>
                <Select
                  value={formData.startTime}
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
                  value={formData.endTime}
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
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                multiline
                rows={3}
                fullWidth
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setSelectedSlot(null);
            setSelectedStylistId(null);
          }}>
            Cancel
          </Button>
          <Button onClick={handleBookingSubmit} variant="contained" color="primary">
            Book Appointment
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar 
        open={snackbarOpen} 
        autoHideDuration={6000} 
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  )
} 