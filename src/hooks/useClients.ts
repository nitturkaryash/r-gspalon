import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { v4 as uuidv4 } from 'uuid'

export interface Client {
  id: string
  full_name: string
  phone: string
  email: string
  created_at: string
  total_spent: number
  pending_payment: number
  last_visit: string | null
  notes: string
}

// Load clients from localStorage or use empty array
const loadClientsFromStorage = (): Client[] => {
  try {
    const savedClients = localStorage.getItem('clients');
    if (savedClients) {
      return JSON.parse(savedClients);
    }
    return [];
  } catch (error) {
    console.error('Error loading clients from localStorage:', error);
    return [];
  }
};

// Save clients to localStorage
const saveClientsToStorage = (clients: Client[]) => {
  try {
    localStorage.setItem('clients', JSON.stringify(clients));
  } catch (error) {
    console.error('Error saving clients to localStorage:', error);
  }
};

// Initialize clients from storage
let mockClients = loadClientsFromStorage();

export function useClients() {
  const queryClient = useQueryClient();

  // Query for all clients
  const { data: clients, isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      return mockClients;
    },
  });

  // Create a new client
  const createClient = useMutation({
    mutationFn: async (data: Omit<Client, 'id' | 'created_at' | 'total_spent' | 'pending_payment' | 'last_visit'>) => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newClient: Client = {
        id: uuidv4(),
        full_name: data.full_name,
        phone: data.phone,
        email: data.email,
        notes: data.notes,
        created_at: new Date().toISOString(),
        total_spent: 0,
        pending_payment: 0,
        last_visit: null
      };
      
      mockClients.push(newClient);
      saveClientsToStorage(mockClients);
      
      return newClient;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client created successfully');
    },
    onError: () => {
      toast.error('Failed to create client');
    },
  });

  // Update client data
  const updateClient = useMutation({
    mutationFn: async (data: Partial<Client> & { id: string }) => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const index = mockClients.findIndex(client => client.id === data.id);
      if (index === -1) {
        throw new Error('Client not found');
      }
      
      mockClients[index] = { ...mockClients[index], ...data };
      saveClientsToStorage(mockClients);
      
      return mockClients[index];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client updated successfully');
    },
    onError: () => {
      toast.error('Failed to update client');
    },
  });

  // Update or create client based on order data
  const updateClientFromOrder = async (
    clientName: string, 
    orderTotal: number, 
    paymentMethod: string,
    orderDate: string
  ) => {
    // Find client by name (case insensitive)
    const clientIndex = mockClients.findIndex(
      client => client.full_name.toLowerCase() === clientName.toLowerCase()
    );
    
    if (clientIndex !== -1) {
      // Update existing client
      const client = mockClients[clientIndex];
      const updatedClient = { 
        ...client,
        last_visit: orderDate
      };
      
      // Update spending based on payment method
      if (paymentMethod === 'bnpl') {
        updatedClient.pending_payment += orderTotal;
      } else {
        updatedClient.total_spent += orderTotal;
      }
      
      mockClients[clientIndex] = updatedClient;
      saveClientsToStorage(mockClients);
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      
      return updatedClient;
    } else {
      // Create new client
      const newClient: Client = {
        id: uuidv4(),
        full_name: clientName,
        phone: '',
        email: '',
        notes: 'Created from order',
        created_at: orderDate,
        total_spent: paymentMethod === 'bnpl' ? 0 : orderTotal,
        pending_payment: paymentMethod === 'bnpl' ? orderTotal : 0,
        last_visit: orderDate
      };
      
      mockClients.push(newClient);
      saveClientsToStorage(mockClients);
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      
      return newClient;
    }
  };

  // Process payment for pending BNPL amount
  const processPendingPayment = useMutation({
    mutationFn: async ({ clientId, amount }: { clientId: string, amount: number }) => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const index = mockClients.findIndex(client => client.id === clientId);
      if (index === -1) {
        throw new Error('Client not found');
      }
      
      if (amount > mockClients[index].pending_payment) {
        throw new Error('Payment amount exceeds pending amount');
      }
      
      mockClients[index] = { 
        ...mockClients[index], 
        pending_payment: mockClients[index].pending_payment - amount,
        total_spent: mockClients[index].total_spent + amount
      };
      
      saveClientsToStorage(mockClients);
      
      return mockClients[index];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Payment processed successfully');
    },
    onError: (error) => {
      toast.error(`Failed to process payment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    },
  });

  return {
    clients,
    isLoading,
    createClient: createClient.mutate,
    updateClient: updateClient.mutate,
    updateClientFromOrder,
    processPendingPayment: processPendingPayment.mutate,
  };
} 