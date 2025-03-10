import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { v4 as uuidv4 } from 'uuid'

// Define break interface
export interface StylistBreak {
  id: string;
  startTime: string; // ISO date string
  endTime: string;   // ISO date string
  reason?: string;
}

export interface Stylist {
  id: string;
  name: string;
  specialties: string[];
  bio?: string;
  gender?: 'male' | 'female' | 'other';
  available: boolean;
  imageUrl?: string;
  email?: string;
  phone?: string;
  breaks?: StylistBreak[]; // Add breaks array to stylist
}

// Initial demo stylists
const initialStylists: Stylist[] = [
  {
    id: '1',
    name: 'John Doe',
    specialties: ['Haircut', 'Styling'],
    bio: 'Expert in modern haircuts',
    gender: 'male',
    available: true,
    breaks: []
  },
  {
    id: '2',
    name: 'Jane Smith',
    specialties: ['Color', 'Styling'],
    bio: 'Color specialist with 5 years experience',
    gender: 'female',
    available: true,
    breaks: []
  }
];

// Load stylists from localStorage or use initialStylists
const loadStylistsFromStorage = (): Stylist[] => {
  try {
    const savedStylists = localStorage.getItem('stylists');
    
    if (savedStylists) {
      return JSON.parse(savedStylists);
    }
    
    // If no stylists found in localStorage, save the initial ones
    localStorage.setItem('stylists', JSON.stringify(initialStylists));
    return initialStylists;
  } catch (error) {
    console.error('Error loading stylists from localStorage:', error);
    return initialStylists;
  }
};

// Get the initial stylists and store in variable for mutations
let mockStylists = loadStylistsFromStorage();

// Save the updated stylists to localStorage
const saveStylistsToStorage = (stylists: Stylist[]) => {
  try {
    localStorage.setItem('stylists', JSON.stringify(stylists));
  } catch (error) {
    console.error('Error saving stylists to localStorage:', error);
  }
};

export function useStylists() {
  const queryClient = useQueryClient()

  const { data: stylists, isLoading } = useQuery({
    queryKey: ['stylists'],
    queryFn: async () => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Return the latest mockStylists data
      return mockStylists;
    },
  });

  const createStylist = useMutation({
    mutationFn: async (newStylist: Omit<Stylist, 'id'>) => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const stylist = {
        id: uuidv4(),
        ...newStylist
      };
      
      mockStylists = [...mockStylists, stylist];
      
      // Save to localStorage
      saveStylistsToStorage(mockStylists);
      
      return stylist;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stylists'] });
      toast.success('Stylist added successfully');
    },
    onError: (error) => {
      toast.error('Failed to add stylist');
      console.error('Error adding stylist:', error);
    },
  });

  const updateStylist = useMutation({
    mutationFn: async (updates: Partial<Stylist> & { id: string }) => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const index = mockStylists.findIndex(s => s.id === updates.id);
      if (index === -1) throw new Error('Stylist not found');
      
      // Log the update for debugging
      if (process.env.NODE_ENV === 'development') {
        console.log('Updating stylist:', {
          existingData: mockStylists[index],
          updates: updates
        });
      }
      
      // Ensure breaks are properly handled
      let processedUpdates = { ...updates };
      
      // If breaks are provided, ensure they are properly formatted
      if (updates.breaks) {
        // Validate each break to ensure dates are properly formatted
        processedUpdates.breaks = updates.breaks.map(breakItem => {
          // Ensure startTime and endTime are valid ISO strings
          let startTime = breakItem.startTime;
          let endTime = breakItem.endTime;
          
          // If they're not valid ISO strings, try to fix them
          if (!(typeof startTime === 'string' && startTime.includes('T'))) {
            try {
              startTime = new Date(startTime).toISOString();
            } catch (e) {
              console.error('Invalid start time:', startTime, e);
            }
          }
          
          if (!(typeof endTime === 'string' && endTime.includes('T'))) {
            try {
              endTime = new Date(endTime).toISOString();
            } catch (e) {
              console.error('Invalid end time:', endTime, e);
            }
          }
          
          return {
            ...breakItem,
            startTime,
            endTime
          };
        });
      }
      
      const updatedStylists = [...mockStylists];
      updatedStylists[index] = {
        ...updatedStylists[index],
        ...processedUpdates
      };
      
      mockStylists = updatedStylists;
      
      // Save to localStorage
      saveStylistsToStorage(mockStylists);
      
      return mockStylists[index];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stylists'] });
      toast.success('Stylist updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update stylist');
      console.error('Error updating stylist:', error);
    },
  });

  const deleteStylist = useMutation({
    mutationFn: async (id: string) => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const index = mockStylists.findIndex(s => s.id === id);
      if (index === -1) throw new Error('Stylist not found');
      
      mockStylists = mockStylists.filter(s => s.id !== id);
      
      // Save to localStorage
      saveStylistsToStorage(mockStylists);
      
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stylists'] });
      toast.success('Stylist deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete stylist');
      console.error('Error deleting stylist:', error);
    },
  });

  return {
    stylists,
    isLoading,
    createStylist: createStylist.mutate,
    updateStylist: updateStylist.mutate,
    deleteStylist: deleteStylist.mutate,
  };
} 