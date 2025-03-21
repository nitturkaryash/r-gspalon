import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { v4 as uuidv4 } from 'uuid'
import type { ProductCollection } from '../models/productTypes'

// Initial demo product collections
const initialProductCollections: ProductCollection[] = [
  {
    id: '1',
    name: 'Hair Care',
    description: 'Shampoos, conditioners, and hair treatments',
    created_at: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Styling Products',
    description: 'Gels, mousses, sprays, and other styling products',
    created_at: new Date().toISOString()
  },
  {
    id: '3',
    name: 'Skin Care',
    description: 'Facial cleansers, moisturizers, and treatments',
    created_at: new Date().toISOString()
  }
];

// Load product collections from localStorage or use initial ones
const loadProductCollectionsFromStorage = (): ProductCollection[] => {
  try {
    const savedCollections = localStorage.getItem('productCollections');
    
    if (savedCollections) {
      return JSON.parse(savedCollections);
    }
    
    // If no collections found in localStorage, save the initial ones
    localStorage.setItem('productCollections', JSON.stringify(initialProductCollections));
    return initialProductCollections;
  } catch (error) {
    console.error('Error loading product collections from localStorage:', error);
    return initialProductCollections;
  }
};

// Get the initial product collections and store in variable for mutations
let mockProductCollections = loadProductCollectionsFromStorage();

// Save the updated product collections to localStorage
const saveProductCollectionsToStorage = (collections: ProductCollection[]) => {
  try {
    localStorage.setItem('productCollections', JSON.stringify(collections));
  } catch (error) {
    console.error('Error saving product collections to localStorage:', error);
  }
};

export function useProductCollections() {
  const queryClient = useQueryClient()

  const { data: productCollections, isLoading } = useQuery({
    queryKey: ['productCollections'],
    queryFn: async () => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Return the latest mockProductCollections data
      return mockProductCollections;
    },
  });

  const createProductCollection = useMutation({
    mutationFn: async (newCollection: Omit<ProductCollection, 'id' | 'created_at'>) => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const collection = {
        id: uuidv4(),
        created_at: new Date().toISOString(),
        ...newCollection
      };
      
      mockProductCollections = [...mockProductCollections, collection];
      
      // Save to localStorage
      saveProductCollectionsToStorage(mockProductCollections);
      
      return collection;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productCollections'] });
      toast.success('Product collection added successfully');
    },
    onError: (error) => {
      toast.error('Failed to add product collection');
      console.error('Error adding product collection:', error);
    },
  });

  const updateProductCollection = useMutation({
    mutationFn: async (updates: Partial<ProductCollection> & { id: string }) => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const index = mockProductCollections.findIndex(c => c.id === updates.id);
      if (index === -1) throw new Error('Product collection not found');
      
      const updatedCollections = [...mockProductCollections];
      updatedCollections[index] = {
        ...updatedCollections[index],
        ...updates
      };
      
      mockProductCollections = updatedCollections;
      
      // Save to localStorage
      saveProductCollectionsToStorage(mockProductCollections);
      
      return mockProductCollections[index];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productCollections'] });
      toast.success('Product collection updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update product collection');
      console.error('Error updating product collection:', error);
    },
  });

  const deleteProductCollection = useMutation({
    mutationFn: async (id: string) => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const index = mockProductCollections.findIndex(c => c.id === id);
      if (index === -1) throw new Error('Product collection not found');
      
      mockProductCollections = mockProductCollections.filter(c => c.id !== id);
      
      // Save to localStorage
      saveProductCollectionsToStorage(mockProductCollections);
      
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productCollections'] });
      queryClient.invalidateQueries({ queryKey: ['collectionProducts'] });
      toast.success('Product collection deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete product collection');
      console.error('Error deleting product collection:', error);
    },
  });

  const getProductCollection = (id: string) => {
    return productCollections?.find(c => c.id === id);
  };

  return {
    productCollections,
    isLoading,
    getProductCollection,
    createProductCollection: createProductCollection.mutate,
    updateProductCollection: updateProductCollection.mutate,
    deleteProductCollection: deleteProductCollection.mutate,
  };
} 