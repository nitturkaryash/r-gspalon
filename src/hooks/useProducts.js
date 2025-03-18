import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { v4 as uuidv4 } from 'uuid';
// Mock data
let mockProducts = [
    {
        id: '1',
        name: 'Shampoo',
        hsn_code: '3305',
        units: 'ml',
        collection_id: '1', // Hair Care
        price: 250,
        cost: 150,
        stock: 50,
        status: 'active',
        created_at: '2023-01-01T00:00:00Z'
    },
    {
        id: '2',
        name: 'Conditioner',
        hsn_code: '3305',
        units: 'ml',
        collection_id: '1', // Hair Care
        price: 200,
        cost: 120,
        stock: 45,
        status: 'active',
        created_at: '2023-01-01T00:00:00Z'
    },
    {
        id: '3',
        name: 'Hair Gel',
        hsn_code: '3305',
        units: 'g',
        collection_id: '2', // Styling Products
        price: 180,
        cost: 100,
        stock: 30,
        status: 'active',
        created_at: '2023-01-01T00:00:00Z'
    },
    {
        id: '4',
        name: 'Hair Spray',
        hsn_code: '3305',
        units: 'ml',
        collection_id: '2', // Styling Products
        price: 220,
        cost: 130,
        stock: 25,
        status: 'inactive',
        created_at: '2023-01-01T00:00:00Z'
    }
];
// Export the updateProductInventory function directly
export const updateProductInventory = async (updates) => {
    try {
        // Process each update
        for (const update of updates) {
            const product = mockProducts.find(p => p.id === update.productId);
            if (!product) {
                throw new Error(`Product not found: ${update.productId}`);
            }
            const newStock = Math.max(0, (product.stock || 0) - update.quantity);
            // Update the product stock
            const index = mockProducts.findIndex(p => p.id === update.productId);
            mockProducts[index] = { ...mockProducts[index], stock: newStock };
        }
        return { success: true };
    }
    catch (err) {
        return { success: false, message: err.message || 'Failed to update product inventory' };
    }
};
export const useProducts = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const queryClient = useQueryClient();
    const fetchProducts = async () => {
        setLoading(true);
        setError(null);
        try {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 500));
            return [...mockProducts];
        }
        catch (err) {
            setError(err.message || 'Failed to fetch products');
            return [];
        }
        finally {
            setLoading(false);
        }
    };
    const fetchProduct = async (id) => {
        setLoading(true);
        setError(null);
        try {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 300));
            const product = mockProducts.find(p => p.id === id);
            return product || null;
        }
        catch (err) {
            setError(err.message || 'Failed to fetch product');
            return null;
        }
        finally {
            setLoading(false);
        }
    };
    const createProduct = async (product) => {
        setLoading(true);
        setError(null);
        try {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 500));
            const newProduct = {
                id: uuidv4(),
                ...product,
                created_at: new Date().toISOString(),
                status: product.status || 'active',
                stock: product.stock || 0
            };
            mockProducts.push(newProduct);
            // Invalidate products query cache
            queryClient.invalidateQueries({ queryKey: ['products'] });
            return newProduct;
        }
        catch (err) {
            setError(err.message || 'Failed to create product');
            throw err;
        }
        finally {
            setLoading(false);
        }
    };
    const updateProduct = async (product) => {
        setLoading(true);
        setError(null);
        try {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 500));
            const index = mockProducts.findIndex(p => p.id === product.id);
            if (index === -1) {
                throw new Error('Product not found');
            }
            mockProducts[index] = { ...mockProducts[index], ...product };
            // Invalidate products query cache
            queryClient.invalidateQueries({ queryKey: ['products'] });
            return mockProducts[index];
        }
        catch (err) {
            setError(err.message || 'Failed to update product');
            throw err;
        }
        finally {
            setLoading(false);
        }
    };
    const deleteProduct = async (id) => {
        setLoading(true);
        setError(null);
        try {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 500));
            const index = mockProducts.findIndex(p => p.id === id);
            if (index === -1) {
                throw new Error('Product not found');
            }
            mockProducts.splice(index, 1);
            // Invalidate products query cache
            queryClient.invalidateQueries({ queryKey: ['products'] });
        }
        catch (err) {
            setError(err.message || 'Failed to delete product');
            throw err;
        }
        finally {
            setLoading(false);
        }
    };
    const updateStock = async (update) => {
        setLoading(true);
        setError(null);
        try {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 300));
            const product = mockProducts.find(p => p.id === update.productId);
            if (!product) {
                throw new Error('Product not found');
            }
            let newStock = 0;
            if (update.type === 'add') {
                newStock = (product.stock || 0) + update.quantity;
            }
            else {
                newStock = Math.max(0, (product.stock || 0) - update.quantity);
            }
            const updatedProduct = await updateProduct({
                ...product,
                stock: newStock
            });
            return updatedProduct;
        }
        catch (err) {
            setError(err.message || 'Failed to update stock');
            throw err;
        }
        finally {
            setLoading(false);
        }
    };
    const fetchProductsByCollection = async (collectionId) => {
        setLoading(true);
        setError(null);
        try {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 500));
            if (!collectionId) {
                return [...mockProducts];
            }
            return mockProducts.filter(p => p.collection_id === collectionId);
        }
        catch (err) {
            setError(err.message || 'Failed to fetch products by collection');
            return [];
        }
        finally {
            setLoading(false);
        }
    };
    const searchProducts = async (query) => {
        setLoading(true);
        setError(null);
        try {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 300));
            if (!query) {
                return [...mockProducts];
            }
            const lowerQuery = query.toLowerCase();
            return mockProducts.filter(p => p.name.toLowerCase().includes(lowerQuery) ||
                p.hsn_code.toLowerCase().includes(lowerQuery));
        }
        catch (err) {
            setError(err.message || 'Failed to search products');
            return [];
        }
        finally {
            setLoading(false);
        }
    };
    const deleteProductsByCollection = async (collectionId) => {
        setLoading(true);
        setError(null);
        try {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 500));
            mockProducts = mockProducts.filter(p => p.collection_id !== collectionId);
            // Invalidate products query cache
            queryClient.invalidateQueries({ queryKey: ['products'] });
        }
        catch (err) {
            setError(err.message || 'Failed to delete products by collection');
            throw err;
        }
        finally {
            setLoading(false);
        }
    };
    const hookUpdateProductInventory = async (updates) => {
        setLoading(true);
        setError(null);
        try {
            // Process each update
            for (const update of updates) {
                await updateStock({
                    productId: update.productId,
                    quantity: update.quantity,
                    type: 'remove' // Always remove stock when selling products
                });
            }
            return { success: true };
        }
        catch (err) {
            setError(err.message || 'Failed to update product inventory');
            return { success: false, message: err.message || 'Failed to update product inventory' };
        }
        finally {
            setLoading(false);
        }
    };
    return {
        loading,
        error,
        fetchProducts,
        fetchProduct,
        createProduct,
        updateProduct,
        deleteProduct,
        updateStock,
        updateProductInventory: hookUpdateProductInventory,
        fetchProductsByCollection,
        searchProducts,
        deleteProductsByCollection
    };
};
