import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { v4 as uuidv4 } from 'uuid'
import type { Product } from '../models/productTypes'

// Initial demo products
const initialProducts: Product[] = [
  {
    id: '1',
    collection_id: '1', // Hair Care
    name: 'Moisture Shampoo',
    description: 'Hydrating shampoo for dry hair',
    price: 1200,
    stock_quantity: 25,
    active: true,
    created_at: new Date().toISOString()
  },
  {
    id: '2',
    collection_id: '1', // Hair Care
    name: 'Volume Conditioner',
    description: 'Adds body and volume to fine hair',
    price: 1400,
    stock_quantity: 20,
    active: true,
    created_at: new Date().toISOString()
  },
  {
    id: '3',
    collection_id: '2', // Styling Products
    name: 'Strong Hold Gel',
    description: 'Maximum hold styling gel',
    price: 900,
    stock_quantity: 30,
    active: true,
    created_at: new Date().toISOString()
  },
  {
    id: '4',
    collection_id: '3', // Skin Care
    name: 'Facial Cleanser',
    description: 'Gentle daily cleanser for all skin types',
    price: 1100,
    stock_quantity: 15,
    active: true,
    created_at: new Date().toISOString()
  }
];

// Load products from localStorage or use initial ones
const loadProductsFromStorage = (): Product[] => {
  try {
    const savedProducts = localStorage.getItem('products');
    
    if (savedProducts) {
      return JSON.parse(savedProducts);
    }
    
    // If no products found in localStorage, save the initial ones
    localStorage.setItem('products', JSON.stringify(initialProducts));
    return initialProducts;
  } catch (error) {
    console.error('Error loading products from localStorage:', error);
    return initialProducts;
  }
};

// Get the initial products and store in variable for mutations
let mockProducts = loadProductsFromStorage();

// Save the updated products to localStorage
const saveProductsToStorage = (products: Product[]) => {
  try {
    localStorage.setItem('products', JSON.stringify(products));
  } catch (error) {
    console.error('Error saving products to localStorage:', error);
  }
};

export function useCollectionProducts(collectionId: string) {
  const queryClient = useQueryClient()

  const { data: products, isLoading } = useQuery({
    queryKey: ['collectionProducts', collectionId],
    queryFn: async () => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Filter products by collection ID
      return mockProducts.filter(p => p.collection_id === collectionId);
    },
    enabled: !!collectionId // Only run query if collectionId is provided
  });

  const createProduct = useMutation({
    mutationFn: async (newProduct: Omit<Product, 'id' | 'collection_id' | 'created_at'>) => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const product = {
        id: uuidv4(),
        collection_id: collectionId,
        created_at: new Date().toISOString(),
        ...newProduct
      };
      
      mockProducts = [...mockProducts, product];
      
      // Save to localStorage
      saveProductsToStorage(mockProducts);
      
      return product;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collectionProducts', collectionId] });
      toast.success('Product added successfully');
    },
    onError: (error) => {
      toast.error('Failed to add product');
      console.error('Error adding product:', error);
    },
  });

  const updateProduct = useMutation({
    mutationFn: async (updates: Partial<Product> & { id: string }) => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const index = mockProducts.findIndex(p => p.id === updates.id);
      if (index === -1) throw new Error('Product not found');
      
      const updatedProducts = [...mockProducts];
      updatedProducts[index] = {
        ...updatedProducts[index],
        ...updates
      };
      
      mockProducts = updatedProducts;
      
      // Save to localStorage
      saveProductsToStorage(mockProducts);
      
      return mockProducts[index];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collectionProducts', collectionId] });
      toast.success('Product updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update product');
      console.error('Error updating product:', error);
    },
  });

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const index = mockProducts.findIndex(p => p.id === id);
      if (index === -1) throw new Error('Product not found');
      
      mockProducts = mockProducts.filter(p => p.id !== id);
      
      // Save to localStorage
      saveProductsToStorage(mockProducts);
      
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collectionProducts', collectionId] });
      toast.success('Product deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete product');
      console.error('Error deleting product:', error);
    },
  });

  const getProduct = (id: string) => {
    return products?.find(p => p.id === id);
  };

  return {
    products,
    isLoading,
    getProduct,
    createProduct: createProduct.mutate,
    updateProduct: updateProduct.mutate,
    deleteProduct: deleteProduct.mutate,
  };
} 