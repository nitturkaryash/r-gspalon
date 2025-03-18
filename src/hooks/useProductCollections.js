import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../utils/supabase/supabaseClient';
import { toast } from 'react-toastify';
import { useAuth } from '../components/AuthProvider';
export function useProductCollections() {
    const queryClient = useQueryClient();
    const [productCollections, setProductCollections] = useState([]);
    const { refreshSession } = useAuth();
    // Fetch all product collections
    const { data, isLoading, error } = useQuery({
        queryKey: ['productCollections'],
        queryFn: async () => {
            try {
                // Use the refreshSession from AuthProvider
                await refreshSession();
                const { data, error } = await supabase
                    .from('product_collections')
                    .select('*')
                    .order('name');
                if (error) {
                    throw error;
                }
                return data;
            }
            catch (error) {
                console.error('Error fetching product collections:', error);
                throw error;
            }
        },
        // Add retry and refetch options
        retry: 1,
        refetchOnWindowFocus: false,
        staleTime: 30000, // 30 seconds
    });
    // Update local state when data changes
    useEffect(() => {
        if (data) {
            setProductCollections(data);
        }
    }, [data]);
    // Get a single product collection by ID
    const getProductCollection = useCallback((id) => {
        return productCollections.find((collection) => collection.id === id);
    }, [productCollections]);
    // Create a new product collection
    const createProductCollectionMutation = useMutation({
        mutationFn: async (newCollection) => {
            try {
                // Use the refreshSession from AuthProvider
                await refreshSession();
                const { data, error } = await supabase
                    .from('product_collections')
                    .insert([{
                        ...newCollection,
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
                console.error('Error creating product collection:', error);
                throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['productCollections'] });
            toast.success('Product collection created successfully');
        },
        onError: (error) => {
            console.error('Error creating product collection:', error);
            if (error instanceof Error) {
                toast.error(`Failed to create product collection: ${error.message}`);
            }
            else {
                toast.error('Failed to create product collection');
            }
        },
    });
    // Update an existing product collection
    const updateProductCollectionMutation = useMutation({
        mutationFn: async (collection) => {
            try {
                // Use the refreshSession from AuthProvider
                await refreshSession();
                const { data, error } = await supabase
                    .from('product_collections')
                    .update({
                    name: collection.name,
                    description: collection.description,
                    updated_at: new Date().toISOString(),
                })
                    .eq('id', collection.id)
                    .select()
                    .single();
                if (error) {
                    throw error;
                }
                return data;
            }
            catch (error) {
                console.error('Error updating product collection:', error);
                throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['productCollections'] });
            toast.success('Product collection updated successfully');
        },
        onError: (error) => {
            console.error('Error updating product collection:', error);
            if (error instanceof Error) {
                toast.error(`Failed to update product collection: ${error.message}`);
            }
            else {
                toast.error('Failed to update product collection');
            }
        },
    });
    // Delete a product collection
    const deleteProductCollectionMutation = useMutation({
        mutationFn: async (id) => {
            try {
                // Use the refreshSession from AuthProvider
                await refreshSession();
                const { error } = await supabase
                    .from('product_collections')
                    .delete()
                    .eq('id', id);
                if (error) {
                    throw error;
                }
                return id;
            }
            catch (error) {
                console.error('Error deleting product collection:', error);
                throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['productCollections'] });
            toast.success('Product collection deleted successfully');
        },
        onError: (error) => {
            console.error('Error deleting product collection:', error);
            if (error instanceof Error) {
                toast.error(`Failed to delete product collection: ${error.message}`);
            }
            else {
                toast.error('Failed to delete product collection');
            }
        },
    });
    return {
        productCollections,
        isLoading,
        error,
        getProductCollection,
        createProductCollection: createProductCollectionMutation.mutate,
        updateProductCollection: updateProductCollectionMutation.mutate,
        deleteProductCollection: deleteProductCollectionMutation.mutate,
    };
}
