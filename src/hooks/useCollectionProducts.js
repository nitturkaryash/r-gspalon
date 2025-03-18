import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../utils/supabase/supabaseClient';
import { toast } from 'react-toastify';
import { useAuth } from '../components/AuthProvider';
export function useCollectionProducts(collectionId) {
    const queryClient = useQueryClient();
    const [products, setProducts] = useState([]);
    const { refreshSession } = useAuth();
    // Fetch all products for a specific collection
    const { data, isLoading, error } = useQuery({
        queryKey: ['products', collectionId],
        queryFn: async () => {
            try {
                // Use the refreshSession from AuthProvider
                await refreshSession();
                const { data, error } = await supabase
                    .from('products')
                    .select('*')
                    .eq('collection_id', collectionId)
                    .order('name');
                if (error) {
                    throw error;
                }
                return data;
            }
            catch (error) {
                console.error('Error fetching products:', error);
                throw error;
            }
        },
        enabled: !!collectionId, // Only run the query if collectionId is provided
    });
    // Update local state when data changes
    useEffect(() => {
        if (data) {
            setProducts(data);
        }
    }, [data]);
    // Create a new product
    const createProductMutation = useMutation({
        mutationFn: async (newProduct) => {
            try {
                // Use the refreshSession from AuthProvider
                await refreshSession();
                const { data, error } = await supabase
                    .from('products')
                    .insert([{
                        ...newProduct,
                        collection_id: collectionId,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    }])
                    .select()
                    .single();
                if (error) {
                    throw error;
                }
                return data;
            }
            catch (error) {
                console.error('Error creating product:', error);
                throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products', collectionId] });
            toast.success('Product created successfully');
        },
        onError: (error) => {
            console.error('Error creating product:', error);
            if (error instanceof Error) {
                toast.error(`Failed to create product: ${error.message}`);
            }
            else {
                toast.error('Failed to create product');
            }
        },
    });
    // Update an existing product
    const updateProductMutation = useMutation({
        mutationFn: async (product) => {
            try {
                // Use the refreshSession from AuthProvider
                await refreshSession();
                const { data, error } = await supabase
                    .from('products')
                    .update({
                    name: product.name,
                    description: product.description,
                    price: product.price,
                    stock_quantity: product.stock_quantity,
                    sku: product.sku,
                    hsn_code: product.hsn_code,
                    active: product.active,
                    updated_at: new Date().toISOString(),
                })
                    .eq('id', product.id)
                    .select()
                    .single();
                if (error) {
                    throw error;
                }
                return data;
            }
            catch (error) {
                console.error('Error updating product:', error);
                throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products', collectionId] });
            toast.success('Product updated successfully');
        },
        onError: (error) => {
            console.error('Error updating product:', error);
            if (error instanceof Error) {
                toast.error(`Failed to update product: ${error.message}`);
            }
            else {
                toast.error('Failed to update product');
            }
        },
    });
    // Delete a product
    const deleteProductMutation = useMutation({
        mutationFn: async (id) => {
            try {
                // Use the refreshSession from AuthProvider
                await refreshSession();
                const { error } = await supabase
                    .from('products')
                    .delete()
                    .eq('id', id);
                if (error) {
                    throw error;
                }
                return id;
            }
            catch (error) {
                console.error('Error deleting product:', error);
                throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products', collectionId] });
            toast.success('Product deleted successfully');
        },
        onError: (error) => {
            console.error('Error deleting product:', error);
            if (error instanceof Error) {
                toast.error(`Failed to delete product: ${error.message}`);
            }
            else {
                toast.error('Failed to delete product');
            }
        },
    });
    return {
        products,
        isLoading,
        error,
        createProduct: createProductMutation.mutate,
        updateProduct: updateProductMutation.mutate,
        deleteProduct: deleteProductMutation.mutate,
    };
}
