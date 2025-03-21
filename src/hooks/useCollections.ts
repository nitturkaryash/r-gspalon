import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { v4 as uuidv4 } from 'uuid'
import type { Collection } from '../models/inventoryTypes'

// Initial demo collections
const initialCollections: Collection[] = [
  {
    id: '1',
    name: 'Hair Care',
    description: 'Shampoos, conditioners, and treatments for all hair types',
    created_at: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Styling Products',
    description: 'Gels, mousses, and sprays for perfect styling',
    created_at: new Date().toISOString()
  }
];

// Load collections from localStorage or use initialCollections
const loadCollectionsFromStorage = (): Collection[] => {
  try {
    const savedCollections = localStorage.getItem('collections');
    
    if (savedCollections) {
      return JSON.parse(savedCollections);
    }
    
    // If no collections found in localStorage, save the initial ones
    localStorage.setItem('collections', JSON.stringify(initialCollections));
    return initialCollections;
  } catch (error) {
    console.error('Error loading collections from localStorage:', error);
    return initialCollections;
  }
};

// Get the initial collections and store in variable for mutations
let mockCollections = loadCollectionsFromStorage();

// Save the updated collections to localStorage
const saveCollectionsToStorage = (collections: Collection[]) => {
  try {
    localStorage.setItem('collections', JSON.stringify(collections));
  } catch (error) {
    console.error('Error saving collections to localStorage:', error);
  }
};

export function useCollections() {
  const queryClient = useQueryClient()

  const { data: collections, isLoading } = useQuery({
    queryKey: ['collections'],
    queryFn: async () => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Return the latest mockCollections data
      return mockCollections;
    },
  });

  const createCollection = useMutation({
    mutationFn: async (newCollection: Omit<Collection, 'id' | 'created_at'>) => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const collection = {
        id: uuidv4(),
        created_at: new Date().toISOString(),
        ...newCollection
      };
      
      mockCollections = [...mockCollections, collection];
      
      // Save to localStorage
      saveCollectionsToStorage(mockCollections);
      
      return collection;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      toast.success('Collection added successfully');
    },
    onError: (error) => {
      toast.error('Failed to add collection');
      console.error('Error adding collection:', error);
    },
  });

  const updateCollection = useMutation({
    mutationFn: async (updates: Partial<Collection> & { id: string }) => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const index = mockCollections.findIndex(c => c.id === updates.id);
      if (index === -1) throw new Error('Collection not found');
      
      const updatedCollections = [...mockCollections];
      updatedCollections[index] = {
        ...updatedCollections[index],
        ...updates
      };
      
      mockCollections = updatedCollections;
      
      // Save to localStorage
      saveCollectionsToStorage(mockCollections);
      
      return mockCollections[index];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      toast.success('Collection updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update collection');
      console.error('Error updating collection:', error);
    },
  });

  const deleteCollection = useMutation({
    mutationFn: async (id: string) => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const index = mockCollections.findIndex(c => c.id === id);
      if (index === -1) throw new Error('Collection not found');
      
      mockCollections = mockCollections.filter(c => c.id !== id);
      
      // Save to localStorage
      saveCollectionsToStorage(mockCollections);
      
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Collection deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete collection');
      console.error('Error deleting collection:', error);
    },
  });

  const getCollection = (id: string) => {
    return collections?.find(c => c.id === id);
  };

  return {
    collections,
    isLoading,
    getCollection,
    createCollection: createCollection.mutate,
    updateCollection: updateCollection.mutate,
    deleteCollection: deleteCollection.mutate,
  };
} 