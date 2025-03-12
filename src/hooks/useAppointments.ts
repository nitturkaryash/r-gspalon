import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { v4 as uuidv4 } from 'uuid'
import { StylistBreak } from './useStylists'
import axios from 'axios'

// Setup axios instance with base URL and error handling
const api = axios.create({
  // Use either your API URL or a default
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add request and response interceptors
api.interceptors.request.use(
  config => {
    // You could add auth tokens here if needed
    return config;
  },
  error => Promise.reject(error)
);

api.interceptors.response.use(
  response => response,
  error => {
    // Log error and show toast
    console.error('API Error:', error);
    if (error.response) {
      toast.error(`Error: ${error.response.data.message || 'Something went wrong'}`);
    } else if (error.request) {
      toast.error('Network Error: No response received');
    } else {
      toast.error(`Error: ${error.message}`);
    }
    return Promise.reject(error);
  }
);

// Mock data types
interface Client {
  id: string;
  full_name: string;
  phone?: string;
}

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
}

interface Stylist {
  id: string;
  name: string;
  breaks?: StylistBreak[]; // Add breaks property to local Stylist interface
}

export interface Appointment {
  id: string;
  client_id?: string;
  clients?: any;
  stylist_id: string;
  service_id: string;
  start_time: string;
  end_time: string;
  notes?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  googleCalendarId?: string; // Add Google Calendar ID field
}

// Mock data
// Instead of hardcoded stylists, load them from localStorage
const loadStylistsFromStorage = (): Stylist[] => {
  try {
    const savedStylists = localStorage.getItem('stylists');
    if (savedStylists) {
      return JSON.parse(savedStylists);
    }
    return mockStylists;
  } catch (error) {
    console.error('Error loading stylists from localStorage:', error);
    return mockStylists;
  }
};

const mockStylists: Stylist[] = [
  { id: '1', name: 'John Doe' },
  { id: '2', name: 'Jane Smith' },
];

const mockServices: Service[] = [
  { id: '1', name: 'Men\'s Haircut', duration: 30, price: 30 },
  { id: '2', name: 'Women\'s Haircut', duration: 60, price: 50 },
  { id: '3', name: 'Hair Coloring', duration: 120, price: 100 },
];

const mockClients: Client[] = [
  { id: '1', full_name: 'Alice Johnson' },
  { id: '2', full_name: 'Bob Wilson' },
];

// Initial appointments data
const initialAppointments = [
  {
    id: '1',
    client_id: '1',
    stylist_id: '1',
    service_id: '1',
    start_time: new Date(new Date().setHours(10, 0, 0, 0)).toISOString(),
    end_time: new Date(new Date().setHours(10, 30, 0, 0)).toISOString(),
    status: 'scheduled',
    paid: false,
    clients: { full_name: 'Alice Johnson' },
    stylists: { name: 'John Doe' },
    services: { name: 'Men\'s Haircut' },
  },
  {
    id: '2',
    client_id: '2',
    stylist_id: '2',
    service_id: '2',
    start_time: new Date(new Date().setHours(14, 0, 0, 0)).toISOString(),
    end_time: new Date(new Date().setHours(15, 0, 0, 0)).toISOString(),
    status: 'scheduled',
    paid: false,
    clients: { full_name: 'Bob Wilson' },
    stylists: { name: 'Jane Smith' },
    services: { name: 'Women\'s Haircut' },
  },
];

// Load appointments from localStorage or use initial data
const loadAppointmentsFromStorage = () => {
  try {
    const savedAppointments = localStorage.getItem('appointments');
    
    if (savedAppointments) {
      return JSON.parse(savedAppointments);
    }
    
    // If no appointments found in localStorage, save the initial ones
    localStorage.setItem('appointments', JSON.stringify(initialAppointments));
    return initialAppointments;
  } catch (error) {
    console.error('Error loading appointments from localStorage:', error);
    return initialAppointments;
  }
};

// Also persist clients in localStorage
const loadClientsFromStorage = () => {
  try {
    const savedClients = localStorage.getItem('clients');
    
    if (savedClients) {
      return JSON.parse(savedClients);
    }
    
    // If no clients found in localStorage, save the initial ones
    localStorage.setItem('clients', JSON.stringify(mockClients));
    return mockClients;
  } catch (error) {
    console.error('Error loading clients from localStorage:', error);
    return mockClients;
  }
};

// Save data to localStorage
const saveToStorage = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
};

// Initialize from localStorage or defaults
let mockAppointments = loadAppointmentsFromStorage();
let persistedClients = loadClientsFromStorage();
// Load stylists from localStorage
let persistedStylists = loadStylistsFromStorage();

interface CreateAppointmentData {
  stylist_id: string;
  service_id: string;
  client_name: string;
  start_time: string;
  end_time: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
  client_id?: string; // Optional client_id
  phone?: string;     // Optional phone
  email?: string;     // Optional email
}

// Add a function to check if an appointment conflicts with a stylist's break
const checkBreakConflict = (
  stylistId: string,
  startTime: string,
  endTime: string,
  stylists: Stylist[]
): boolean => {
  // Find the stylist
  const stylist = stylists.find(s => s.id === stylistId);
  if (!stylist || !stylist.breaks || stylist.breaks.length === 0) {
    return false; // No conflicts if stylist has no breaks
  }

  const appointmentStart = new Date(startTime).getTime();
  const appointmentEnd = new Date(endTime).getTime();

  // Check if any break overlaps with the appointment time
  return stylist.breaks.some((breakItem: StylistBreak) => {
    const breakStart = new Date(breakItem.startTime).getTime();
    const breakEnd = new Date(breakItem.endTime).getTime();

    // Check for overlap
    return (
      (appointmentStart >= breakStart && appointmentStart < breakEnd) || // Appointment starts during break
      (appointmentEnd > breakStart && appointmentEnd <= breakEnd) || // Appointment ends during break
      (appointmentStart <= breakStart && appointmentEnd >= breakEnd) // Break is within appointment
    );
  });
};

// Update the updateAppointmentGoogleCalendarId function to use axios with localStorage fallback
const updateAppointmentGoogleCalendarId = async (appointmentId: string, googleCalendarId: string) => {
  try {
    const queryClient = useQueryClient();
    
    try {
      // Try to update via API first
      await api.patch(`/appointments/${appointmentId}`, { 
        googleCalendarId 
      });
    } catch (apiError) {
      console.log('API update failed, using localStorage fallback', apiError);
      
      // Fallback to localStorage
      const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
      const updatedAppointments = appointments.map((appointment: Appointment) => 
        appointment.id === appointmentId 
          ? { ...appointment, googleCalendarId } 
          : appointment
      );
      localStorage.setItem('appointments', JSON.stringify(updatedAppointments));
    }
    
    // Update React Query cache regardless of storage method
    queryClient.setQueryData<Appointment[]>(['appointments'], (oldData) => {
      if (!oldData) return [];
      
      return oldData.map(appointment => 
        appointment.id === appointmentId 
          ? { ...appointment, googleCalendarId } 
          : appointment
      );
    });
    
    return true;
  } catch (error) {
    console.error('Error updating appointment Google Calendar ID:', error);
    throw error;
  }
};

export function useAppointments() {
  const queryClient = useQueryClient()

  const { data: appointments, isLoading } = useQuery({
    queryKey: ['appointments'],
    queryFn: async () => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      return mockAppointments;
    },
  });

  const createAppointment = useMutation({
    mutationFn: async (data: CreateAppointmentData) => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Load latest stylists data to check breaks
      const stylists = loadStylistsFromStorage();
      
      // Check if this appointment conflicts with any stylist breaks
      if (checkBreakConflict(data.stylist_id, data.start_time, data.end_time, stylists)) {
        throw new Error('This appointment conflicts with a scheduled break for the stylist');
      }
      
      // Find or create client
      let client_id: string;
      if (data.client_id) {
        client_id = data.client_id;
      } else {
        const client = persistedClients.find((c: Client) => c.full_name.toLowerCase() === data.client_name.toLowerCase());
        if (client) {
          client_id = client.id;
        } else {
          // Create new client
          const newClient = {
            id: uuidv4(),
            full_name: data.client_name,
            phone: data.phone || '',
            email: data.email || '',
            total_spent: 0,
            appointment_count: 0,
            created_at: new Date().toISOString()
          };
          persistedClients = [...persistedClients, newClient];
          saveToStorage('clients', persistedClients);
          client_id = newClient.id;
        }
      }
      
      // Find stylist and service
      const stylist = stylists.find(s => s.id === data.stylist_id);
      const service = mockServices.find(s => s.id === data.service_id);
      
      if (!stylist || !service) {
        console.error('Stylist or service not found:', { 
          stylistId: data.stylist_id, 
          serviceId: data.service_id,
          availableStylists: stylists,
          availableServices: mockServices
        });
        throw new Error('Stylist or service not found');
      }
      
      // Create new appointment
      const newAppointment = {
        id: uuidv4(),
        client_id,
        stylist_id: data.stylist_id,
        service_id: data.service_id,
        start_time: data.start_time,
        end_time: data.end_time,
        status: data.status,
        notes: data.notes,
        paid: false,
        clients: { full_name: data.client_name },
        stylists: { name: stylist.name },
        services: { name: service.name },
      };
      
      // Update appointments with the new one
      mockAppointments = [...mockAppointments, newAppointment];
      
      // Save updated appointments to localStorage
      saveToStorage('appointments', mockAppointments);
      
      return newAppointment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Appointment created successfully');
    },
    onError: (error) => {
      toast.error(`Failed to create appointment: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('Error creating appointment:', error);
    },
  });

  const updateAppointment = useMutation({
    mutationFn: async (updates: Partial<Appointment> & { id: string }) => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const index = mockAppointments.findIndex((a: Appointment) => a.id === updates.id);
      if (index === -1) throw new Error('Appointment not found');
      
      // Create a new array with the updated appointment
      const updatedAppointments = [...mockAppointments];
      updatedAppointments[index] = {
        ...updatedAppointments[index],
        ...updates,
      };
      
      mockAppointments = updatedAppointments;
      
      // Save updated appointments to localStorage
      saveToStorage('appointments', mockAppointments);
      
      return mockAppointments[index];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Appointment updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update appointment');
      console.error('Error updating appointment:', error);
    },
  });

  const deleteAppointment = useMutation({
    mutationFn: async (id: string) => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const index = mockAppointments.findIndex((a: Appointment) => a.id === id);
      if (index === -1) throw new Error('Appointment not found');
      
      // Filter out the appointment to delete
      mockAppointments = mockAppointments.filter((a: Appointment) => a.id !== id);
      
      // Save updated appointments to localStorage
      saveToStorage('appointments', mockAppointments);
      
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Appointment deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete appointment');
      console.error('Error deleting appointment:', error);
    },
  });

  return {
    appointments,
    isLoading,
    createAppointment: createAppointment.mutate,
    updateAppointment: updateAppointment.mutate,
    deleteAppointment: deleteAppointment.mutate,
    updateAppointmentGoogleCalendarId,
  };
} 