import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { v4 as uuidv4 } from 'uuid'
import type { ServiceCollection } from '../models/serviceTypes'

// Initial demo service collections
const initialServiceCollections: ServiceCollection[] = [
  {
    id: '1',
    name: 'Haircuts',
    description: 'Basic and specialty haircuts for all hair types',
    created_at: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Hair Coloring',
    description: 'Full color, highlights, balayage, and more',
    created_at: new Date().toISOString()
  },
  {
    id: '3',
    name: 'Treatments',
    description: 'Deep conditioning, keratin, and other specialty treatments',
    created_at: new Date().toISOString()
  }
];

// Load service collections from localStorage or use initial ones
const loadServiceCollectionsFromStorage = (): ServiceCollection[] => {
  try {
    const savedCollections = localStorage.getItem('serviceCollections');
    
    if (savedCollections) {
      return JSON.parse(savedCollections);
    }
    
    // If no collections found in localStorage, save the initial ones
    localStorage.setItem('serviceCollections', JSON.stringify(initialServiceCollections));
    return initialServiceCollections;
  } catch (error) {
    console.error('Error loading service collections from localStorage:', error);
    return initialServiceCollections;
  }
};

// Get the initial service collections and store in variable for mutations
let mockServiceCollections = loadServiceCollectionsFromStorage();

// Save the updated service collections to localStorage
const saveServiceCollectionsToStorage = (collections: ServiceCollection[]) => {
  try {
    localStorage.setItem('serviceCollections', JSON.stringify(collections));
  } catch (error) {
    console.error('Error saving service collections to localStorage:', error);
  }
};

export function useServiceCollections() {
  const queryClient = useQueryClient()

  const { data: serviceCollections, isLoading } = useQuery({
    queryKey: ['serviceCollections'],
    queryFn: async () => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Return the latest mockServiceCollections data
      return mockServiceCollections;
    },
  });

  const createServiceCollection = useMutation({
    mutationFn: async (newCollection: Omit<ServiceCollection, 'id' | 'created_at'>) => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const collection = {
        id: uuidv4(),
        created_at: new Date().toISOString(),
        ...newCollection
      };
      
      mockServiceCollections = [...mockServiceCollections, collection];
      
      // Save to localStorage
      saveServiceCollectionsToStorage(mockServiceCollections);
      
      return collection;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceCollections'] });
      toast.success('Service collection added successfully');
    },
    onError: (error) => {
      toast.error('Failed to add service collection');
      console.error('Error adding service collection:', error);
    },
  });

  const updateServiceCollection = useMutation({
    mutationFn: async (updates: Partial<ServiceCollection> & { id: string }) => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const index = mockServiceCollections.findIndex(c => c.id === updates.id);
      if (index === -1) throw new Error('Service collection not found');
      
      const updatedCollections = [...mockServiceCollections];
      updatedCollections[index] = {
        ...updatedCollections[index],
        ...updates
      };
      
      mockServiceCollections = updatedCollections;
      
      // Save to localStorage
      saveServiceCollectionsToStorage(mockServiceCollections);
      
      return mockServiceCollections[index];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceCollections'] });
      toast.success('Service collection updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update service collection');
      console.error('Error updating service collection:', error);
    },
  });

  const deleteServiceCollection = useMutation({
    mutationFn: async (id: string) => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const index = mockServiceCollections.findIndex(c => c.id === id);
      if (index === -1) throw new Error('Service collection not found');
      
      mockServiceCollections = mockServiceCollections.filter(c => c.id !== id);
      
      // Save to localStorage
      saveServiceCollectionsToStorage(mockServiceCollections);
      
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceCollections'] });
      queryClient.invalidateQueries({ queryKey: ['collectionServices'] });
      toast.success('Service collection deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete service collection');
      console.error('Error deleting service collection:', error);
    },
  });

  const getServiceCollection = (id: string) => {
    return serviceCollections?.find(c => c.id === id);
  };

  return {
    serviceCollections,
    isLoading,
    getServiceCollection,
    createServiceCollection: createServiceCollection.mutate,
    updateServiceCollection: updateServiceCollection.mutate,
    deleteServiceCollection: deleteServiceCollection.mutate,
  };
} 