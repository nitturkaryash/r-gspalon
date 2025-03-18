import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { v4 as uuidv4 } from 'uuid';
// Initial demo services for collections
const initialCollectionServices = [
    {
        id: '1',
        collection_id: '1', // Haircuts
        name: 'Men\'s Haircut',
        description: 'Classic men\'s haircut and styling',
        price: 3000, // ₹30.00
        duration: 30,
        active: true,
        created_at: new Date().toISOString()
    },
    {
        id: '2',
        collection_id: '1', // Haircuts
        name: 'Women\'s Haircut',
        description: 'Women\'s haircut and styling',
        price: 5000, // ₹50.00
        duration: 60,
        active: true,
        created_at: new Date().toISOString()
    },
    {
        id: '3',
        collection_id: '1', // Haircuts
        name: 'Kid\'s Haircut',
        description: 'Haircut for children under 12',
        price: 2000, // ₹20.00
        duration: 30,
        active: true,
        created_at: new Date().toISOString()
    },
    {
        id: '4',
        collection_id: '2', // Hair Coloring
        name: 'Full Color',
        description: 'Full head color application',
        price: 10000, // ₹100.00
        duration: 120,
        active: true,
        created_at: new Date().toISOString()
    },
    {
        id: '5',
        collection_id: '2', // Hair Coloring
        name: 'Highlights',
        description: 'Partial highlights',
        price: 8000, // ₹80.00
        duration: 90,
        active: true,
        created_at: new Date().toISOString()
    },
    {
        id: '6',
        collection_id: '3', // Treatments
        name: 'Deep Conditioning',
        description: 'Deep conditioning treatment for damaged hair',
        price: 3500, // ₹35.00
        duration: 45,
        active: true,
        created_at: new Date().toISOString()
    },
];
// Load collection services from localStorage or use initial ones
const loadCollectionServicesFromStorage = () => {
    try {
        const savedServices = localStorage.getItem('collectionServices');
        if (savedServices) {
            return JSON.parse(savedServices);
        }
        // If no services found in localStorage, save the initial ones
        localStorage.setItem('collectionServices', JSON.stringify(initialCollectionServices));
        return initialCollectionServices;
    }
    catch (error) {
        console.error('Error loading collection services from localStorage:', error);
        return initialCollectionServices;
    }
};
// Get the initial collection services and store in variable for mutations
let mockCollectionServices = loadCollectionServicesFromStorage();
// Save the updated collection services to localStorage
const saveCollectionServicesToStorage = (services) => {
    try {
        localStorage.setItem('collectionServices', JSON.stringify(services));
    }
    catch (error) {
        console.error('Error saving collection services to localStorage:', error);
    }
};
export function useCollectionServices(collectionId) {
    const queryClient = useQueryClient();
    const { data: services, isLoading } = useQuery({
        queryKey: ['collectionServices', collectionId],
        queryFn: async () => {
            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 300));
            // If collection ID is provided, filter services
            if (collectionId) {
                return mockCollectionServices.filter(s => s.collection_id === collectionId);
            }
            // Return all services
            return mockCollectionServices;
        },
    });
    const createService = useMutation({
        mutationFn: async (newService) => {
            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 300));
            const service = {
                id: uuidv4(),
                created_at: new Date().toISOString(),
                ...newService
            };
            mockCollectionServices = [...mockCollectionServices, service];
            // Save to localStorage
            saveCollectionServicesToStorage(mockCollectionServices);
            return service;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['collectionServices'] });
            toast.success('Service added successfully');
        },
        onError: (error) => {
            toast.error('Failed to add service');
            console.error('Error adding service:', error);
        },
    });
    const updateService = useMutation({
        mutationFn: async (updates) => {
            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 300));
            const index = mockCollectionServices.findIndex(s => s.id === updates.id);
            if (index === -1)
                throw new Error('Service not found');
            const updatedServices = [...mockCollectionServices];
            updatedServices[index] = {
                ...updatedServices[index],
                ...updates
            };
            mockCollectionServices = updatedServices;
            // Save to localStorage
            saveCollectionServicesToStorage(mockCollectionServices);
            return mockCollectionServices[index];
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['collectionServices'] });
            toast.success('Service updated successfully');
        },
        onError: (error) => {
            toast.error('Failed to update service');
            console.error('Error updating service:', error);
        },
    });
    const deleteService = useMutation({
        mutationFn: async (id) => {
            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 300));
            const index = mockCollectionServices.findIndex(s => s.id === id);
            if (index === -1)
                throw new Error('Service not found');
            mockCollectionServices = mockCollectionServices.filter(s => s.id !== id);
            // Save to localStorage
            saveCollectionServicesToStorage(mockCollectionServices);
            return { success: true };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['collectionServices'] });
            toast.success('Service deleted successfully');
        },
        onError: (error) => {
            toast.error('Failed to delete service');
            console.error('Error deleting service:', error);
        },
    });
    // Delete all services in a collection
    const deleteServicesByCollection = async (collectionId) => {
        mockCollectionServices = mockCollectionServices.filter(s => s.collection_id !== collectionId);
        saveCollectionServicesToStorage(mockCollectionServices);
        queryClient.invalidateQueries({ queryKey: ['collectionServices'] });
    };
    return {
        services,
        isLoading,
        createService: createService.mutate,
        updateService: updateService.mutate,
        deleteService: deleteService.mutate,
        deleteServicesByCollection
    };
}
