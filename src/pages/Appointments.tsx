import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Snackbar,
  Alert,
  CircularProgress,
  InputAdornment,
} from '@mui/material'
import { useAppointments } from '../hooks/useAppointments'
import { useStylists, Stylist, StylistBreak } from '../hooks/useStylists'
import { useServices, Service } from '../hooks/useServices'
import { useServiceCollections } from '../hooks/useServiceCollections'
import { useCollectionServices } from '../hooks/useCollectionServices'
import { ServiceItem } from '../models/serviceTypes'
import { format, addDays, subDays } from 'date-fns'
import StylistDayView, { Break } from '../components/StylistDayView'
import { Search as SearchIcon } from '@mui/icons-material'
import { formatCurrency } from '../utils/format'
import { toast } from 'react-toastify'
import { v4 as uuidv4 } from 'uuid'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { DateSelectArg, EventClickArg } from '@fullcalendar/core'

interface BookingFormData {
  clientName: string;
  serviceId: string;
  stylistId: string;
  startTime: string;
  endTime: string;
  notes?: string;
  mobileNumber?: string;
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

  // Add state for service filtering
  const { serviceCollections } = useServiceCollections();
  const { services: collectionServices, isLoading: isLoadingCollectionServices } = useCollectionServices();
  const [selectedServiceCollection, setSelectedServiceCollection] = useState<string>('');
  const [serviceSearchQuery, setServiceSearchQuery] = useState<string>('');

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

  // Add a function to filter services based on collection and search query
  const getFilteredServices = () => {
    // Use collectionServices if available, otherwise fall back to services
    const allServices = collectionServices || services || [];
    
    let filteredServices = [...allServices];
    
    // Filter by collection if one is selected
    if (selectedServiceCollection) {
      filteredServices = filteredServices.filter(service => {
        // Check if service is from collection services (which has collection_id)
        if ('collection_id' in service) {
          return service.collection_id === selectedServiceCollection;
        }
        return false;
      });
    }
    
    // Filter by search query if one is entered
    if (serviceSearchQuery) {
      const query = serviceSearchQuery.toLowerCase();
      filteredServices = filteredServices.filter(service => 
        service.name.toLowerCase().includes(query) || 
        (service.description && service.description.toLowerCase().includes(query))
      );
    }
    
    return filteredServices;
  };

  // Update the handleAddBreak function
  const handleAddBreak = async (stylistId: string, breakData: Omit<Break, 'id'>) => {
    try {
      // Create a new break with a unique ID
      const newBreak: StylistBreak = {
        id: uuidv4(),
        ...breakData
      };
      
      // Find the stylist to update
      if (!stylists) {
        console.error('Stylists array is undefined');
        toast.error('Failed to add break: Stylists not loaded');
        return;
      }
      
      const stylist = stylists.find(s => s.id === stylistId);
      if (!stylist) {
        console.error('Stylist not found:', stylistId);
        toast.error('Failed to add break: Stylist not found');
        return;
      }
      
      // Update the stylist's breaks
      const updatedBreaks = [...(stylist.breaks || []), newBreak];
      const updatedStylist = { ...stylist, breaks: updatedBreaks };
      
      // Update the stylist in the database
      await updateStylist(updatedStylist);
      
      toast.success('Break added successfully');
    } catch (error) {
      console.error('Failed to add break:', error);
      toast.error('Failed to add break');
    }
  };

  // Convert stylists to the expected format for StylistDayView
  const convertStylists = (stylists: Stylist[]): any[] => {
    return stylists.map(stylist => ({
      ...stylist,
      breaks: (stylist.breaks || []).map(breakItem => ({
        ...breakItem,
        // Ensure all required properties for Break type are present
        id: breakItem.id,
        startTime: breakItem.startTime,
        endTime: breakItem.endTime,
        reason: breakItem.reason || ''
      }))
    }));
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
        stylists={convertStylists(stylists || [])}
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
          }
        }}
        onDeleteAppointment={async (appointmentId) => {
          try {
            await deleteAppointment(appointmentId);
            toast.success('Appointment deleted successfully');
          } catch (error) {
            console.error('Failed to delete appointment:', error);
            toast.error('Failed to delete appointment');
          }
        }}
        onAddBreak={handleAddBreak}
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
              <TextField
                label="Mobile Number"
                value={formData.mobileNumber || ''}
                onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
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
              <Typography variant="subtitle1" gutterBottom>
                Service Selection
              </Typography>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel id="service-collection-label">Service Collection</InputLabel>
                    <Select
                      labelId="service-collection-label"
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
              
              {/* Service Cards */}
              <Box sx={{ maxHeight: '300px', overflow: 'auto', mb: 2 }}>
                <Grid container spacing={1}>
                  {getFilteredServices().length > 0 ? (
                    getFilteredServices().map((service) => (
                      <Grid item xs={12} sm={6} key={service.id}>
                        <Paper 
                          elevation={formData.serviceId === service.id ? 4 : 1}
                          sx={{ 
                            p: 1.5, 
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            border: formData.serviceId === service.id ? '2px solid' : '1px solid',
                            borderColor: formData.serviceId === service.id ? 'primary.main' : 'divider',
                            bgcolor: formData.serviceId === service.id ? 'rgba(25, 118, 210, 0.12)' : 'background.paper',
                            transform: formData.serviceId === service.id ? 'translateY(-3px)' : 'none',
                            boxShadow: formData.serviceId === service.id ? 3 : 1,
                            '&:hover': {
                              bgcolor: formData.serviceId === service.id ? 'rgba(25, 118, 210, 0.12)' : 'action.hover',
                              transform: 'translateY(-2px)',
                              boxShadow: 2
                            }
                          }}
                          onClick={() => setFormData({ ...formData, serviceId: service.id })}
                        >
                          <Typography variant="subtitle1" fontWeight={formData.serviceId === service.id ? "bold" : "medium"} color={formData.serviceId === service.id ? "primary.main" : "text.primary"}>
                            {formData.serviceId === service.id && "✓ "}{service.name}
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