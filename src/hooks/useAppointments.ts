import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { v4 as uuidv4 } from 'uuid'
import { StylistBreak } from './useStylists'

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
  client_id: string;
  stylist_id: string;
  service_id: string;
  start_time: string;
  end_time: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
  paid: boolean;
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

// Add a helper function to ensure consistent date-time formatting
const formatAppointmentTime = (dateTimeString: string): string => {
  const date = new Date(dateTimeString);
  // Ensure the date is valid
  if (isNaN(date.getTime())) {
    console.error('Invalid date:', dateTimeString);
    throw new Error('Invalid appointment time');
  }
  
  // Preserve the exact time components without any rounding
  // This ensures appointments are positioned exactly at their scheduled time
  const formattedDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    0,
    0
  );
  
  // Return ISO string for consistent formatting
  return formattedDate.toISOString();
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
      
      // Format appointment times consistently with exact minutes
      const formattedStartTime = formatAppointmentTime(data.start_time);
      const formattedEndTime = formatAppointmentTime(data.end_time);
      
      // Load latest stylists data to check breaks
      const stylists = loadStylistsFromStorage();
      
      // Check if this appointment conflicts with any stylist breaks
      if (checkBreakConflict(data.stylist_id, formattedStartTime, formattedEndTime, stylists)) {
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
      
      // Create new appointment with precisely formatted times
      const newAppointment = {
        id: uuidv4(),
        client_id,
        stylist_id: data.stylist_id,
        service_id: data.service_id,
        start_time: formattedStartTime,
        end_time: formattedEndTime,
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
      
      // Format appointment times if they are being updated
      const formattedUpdates = { ...updates };
      if (updates.start_time) {
        formattedUpdates.start_time = formatAppointmentTime(updates.start_time);
      }
      if (updates.end_time) {
        formattedUpdates.end_time = formatAppointmentTime(updates.end_time);
      }
      
      const index = mockAppointments.findIndex((a: Appointment) => a.id === updates.id);
      if (index === -1) throw new Error('Appointment not found');
      
      // Create a new array with the updated appointment
      const updatedAppointments = [...mockAppointments];
      updatedAppointments[index] = {
        ...updatedAppointments[index],
        ...formattedUpdates,
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
  };
} 