import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { v4 as uuidv4 } from 'uuid'

export interface Service {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  category: string;
  active: boolean;
}

// Mock services data
let mockServices: Service[] = [
  { 
    id: '1', 
    name: 'Men\'s Haircut', 
    description: 'Classic men\'s haircut and styling',
    duration: 30, 
    price: 3000.00, 
    category: 'Haircut',
    active: true
  },
  { 
    id: '2', 
    name: 'Women\'s Haircut', 
    description: 'Women\'s haircut and styling',
    duration: 60, 
    price: 5000.00, 
    category: 'Haircut',
    active: true
  },
  { 
    id: '3', 
    name: 'Hair Coloring', 
    description: 'Full hair coloring service',
    duration: 120, 
    price: 10000.00, 
    category: 'Color',
    active: true
  }
]

export function useServices() {
  const queryClient = useQueryClient()

  const { data: services, isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300))
      return mockServices
    },
  })

  const createService = useMutation({
    mutationFn: async (newService: Omit<Service, 'id'>) => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300))
      
      const service = {
        id: uuidv4(),
        ...newService
      }
      
      mockServices.push(service)
      return service
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
      toast.success('Service created successfully')
    },
    onError: (error) => {
      toast.error('Failed to create service')
      console.error('Error creating service:', error)
    },
  })

  const updateService = useMutation({
    mutationFn: async (updates: Partial<Service> & { id: string }) => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300))
      
      const index = mockServices.findIndex(s => s.id === updates.id)
      if (index === -1) throw new Error('Service not found')
      
      mockServices[index] = {
        ...mockServices[index],
        ...updates
      }
      
      return mockServices[index]
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
      toast.success('Service updated successfully')
    },
    onError: (error) => {
      toast.error('Failed to update service')
      console.error('Error updating service:', error)
    },
  })

  const deleteService = useMutation({
    mutationFn: async (id: string) => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300))
      
      const index = mockServices.findIndex(s => s.id === id)
      if (index === -1) throw new Error('Service not found')
      
      mockServices = mockServices.filter(s => s.id !== id)
      return { success: true }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
      toast.success('Service deleted successfully')
    },
    onError: (error) => {
      toast.error('Failed to delete service')
      console.error('Error deleting service:', error)
    },
  })

  return {
    services,
    isLoading,
    createService: createService.mutate,
    updateService: updateService.mutate,
    deleteService: deleteService.mutate,
  }
} 