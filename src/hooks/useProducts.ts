import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Define the Product interface
export interface Product {
  id: string;
  product_name: string;
  hsn_code: string;
  unit_type: string;
  mrp_incl_gst: number;
  gst_percentage: number;
  discount_on_purchase_percentage: number;
  created_at?: string;
  updated_at?: string;
}

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch products on hook initialization
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Try to get products from localStorage
      const savedProducts = localStorage.getItem('products');
      if (savedProducts) {
        setProducts(JSON.parse(savedProducts));
      } else {
        // Initialize with empty array if no products found
        setProducts([]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to load products. Please try again.');
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const saveProducts = (updatedProducts: Product[]) => {
    try {
      localStorage.setItem('products', JSON.stringify(updatedProducts));
    } catch (error) {
      console.error('Error saving products to localStorage:', error);
      setError('Failed to save products. Please try again.');
    }
  };

  const addProduct = (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const timestamp = new Date().toISOString();
      const newProduct: Product = {
        id: uuidv4(),
        ...product,
        created_at: timestamp,
        updated_at: timestamp,
      };
      
      const updatedProducts = [newProduct, ...products];
      setProducts(updatedProducts);
      saveProducts(updatedProducts);
      
      return { success: true, product: newProduct };
    } catch (error) {
      console.error('Error adding product:', error);
      setError('Failed to add product. Please try again.');
      return { success: false, error };
    }
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    try {
      const timestamp = new Date().toISOString();
      const updatedProducts = products.map(product => 
        product.id === id 
          ? { 
              ...product, 
              ...updates, 
              updated_at: timestamp 
            } 
          : product
      );
      
      setProducts(updatedProducts);
      saveProducts(updatedProducts);
      
      return { success: true };
    } catch (error) {
      console.error('Error updating product:', error);
      setError('Failed to update product. Please try again.');
      return { success: false, error };
    }
  };

  const deleteProduct = (id: string) => {
    try {
      const updatedProducts = products.filter(product => product.id !== id);
      setProducts(updatedProducts);
      saveProducts(updatedProducts);
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting product:', error);
      setError('Failed to delete product. Please try again.');
      return { success: false, error };
    }
  };

  return {
    products,
    isLoading,
    error,
    fetchProducts,
    addProduct,
    updateProduct,
    deleteProduct,
  };
}; 