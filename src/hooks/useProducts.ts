import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { v4 as uuidv4 } from 'uuid'
import type { Product } from '../models/inventoryTypes'

// Initial demo products
const initialProducts: Product[] = [
  {
    id: '1',
    collection_id: '1', // Hair Care
    name: 'Moisturizing Shampoo',
    price: 899,
    cost: 450,
    stock: 25, // Initial stock
    status: 'active',
    created_at: new Date().toISOString()
  },
  {
    id: '2',
    collection_id: '1', // Hair Care
    name: 'Deep Conditioner',
    price: 1299,
    cost: 580,
    stock: 18, // Initial stock
    status: 'active',
    created_at: new Date().toISOString()
  },
  {
    id: '3',
    collection_id: '2', // Styling Products
    name: 'Strong Hold Gel',
    price: 699,
    cost: 320,
    stock: 30, // Initial stock
    status: 'active',
    created_at: new Date().toISOString()
  },
  {
    id: '4',
    collection_id: '2', // Styling Products
    name: 'Volume Mousse',
    price: 799,
    cost: 350,
    stock: 12, // Initial stock
    status: 'inactive',
    created_at: new Date().toISOString()
  }
];

// Load products from localStorage or use initialProducts
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

/**
 * Update product inventory when products are purchased
 * @param productUpdates Array of product IDs and quantities to update
 * @returns Object with success status and updated products
 */
export const updateProductInventory = (
  productUpdates: Array<{ productId: string; quantity: number }>
): { success: boolean; updatedProducts?: Product[] } => {
  try {
    // Load the latest products from storage
    const currentProducts = loadProductsFromStorage();
    
    // Create a copy of the products array to update
    const updatedProducts = [...currentProducts];
    
    // Update each product's stock
    for (const update of productUpdates) {
      const productIndex = updatedProducts.findIndex(p => p.id === update.productId);
      
      if (productIndex === -1) {
        console.error(`Product with ID ${update.productId} not found`);
        continue;
      }
      
      const product = updatedProducts[productIndex];
      // Default to 0 if stock is undefined
      const currentStock = product.stock ?? 0;
      const newStock = Math.max(0, currentStock - update.quantity);
      
      // Update the product stock
      updatedProducts[productIndex] = {
        ...product,
        stock: newStock
      };
    }
    
    // Save the updated products to storage
    mockProducts = updatedProducts;
    saveProductsToStorage(updatedProducts);
    
    return { success: true, updatedProducts };
  } catch (error) {
    console.error('Error updating product inventory:', error);
    return { success: false };
  }
};

// Update the function to handle potentially undefined stock property
const updateProductQuantity = async (productId: string, update: { quantity: number }) => {
  const product = mockProducts.find(p => p.id === productId);
  if (product) {
    // Default to 0 if stock is undefined 
    const currentStock = product.stock ?? 0;
    const newStock = Math.max(0, currentStock - update.quantity);
    product.stock = newStock;
    
    // Return the updated product
    return { ...product };
  }
  throw new Error('Product not found');
};

export function useProducts(collectionId?: string) {
  const queryClient = useQueryClient()

  const { data: products, isLoading } = useQuery({
    queryKey: ['products', collectionId],
    queryFn: async () => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // If collection ID is provided, filter products
      if (collectionId) {
        return mockProducts.filter(p => p.collection_id === collectionId);
      }
      
      // Return all products
      return mockProducts;
    },
  });

  const createProduct = useMutation({
    mutationFn: async (newProduct: Omit<Product, 'id' | 'created_at'>) => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const product = {
        id: uuidv4(),
        created_at: new Date().toISOString(),
        ...newProduct
      };
      
      mockProducts = [...mockProducts, product];
      
      // Save to localStorage
      saveProductsToStorage(mockProducts);
      
      return product;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
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
      queryClient.invalidateQueries({ queryKey: ['products'] });
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
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete product');
      console.error('Error deleting product:', error);
    },
  });

  // Delete all products in a collection
  const deleteProductsByCollection = async (collectionId: string) => {
    mockProducts = mockProducts.filter(p => p.collection_id !== collectionId);
    saveProductsToStorage(mockProducts);
    queryClient.invalidateQueries({ queryKey: ['products'] });
  };

  return {
    products,
    isLoading,
    createProduct: createProduct.mutate,
    updateProduct: updateProduct.mutate,
    deleteProduct: deleteProduct.mutate,
    deleteProductsByCollection,
    fetchProducts: async () => {
      // Simply return the current products, or re-fetch if needed
      return products || [];
    }
  };
} 