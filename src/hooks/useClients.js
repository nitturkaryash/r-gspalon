import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/database';
import { useLiveQuery } from 'dexie-react-hooks';

// Create clients table if it doesn't exist
async function ensureClientsTable() {
  if (!db.tables.some(table => table.name === 'clients')) {
    console.log('Creating clients table...');
    // Create the clients table
    db.version(db.verno + 1).stores({
      clients: '++id, full_name, phone, email, total_spent, pending_payment'
    });
    
    // Update the database version to add the clients table
    await db.open();
    console.log('Clients table created successfully');
  }

  // Make sure we can access the clients table
  if (!db.clients) {
    db.clients = db.table('clients');
  }
}

// Initialize clients table
ensureClientsTable().catch(err => {
  console.error('Failed to initialize clients table:', err);
});

export function useClients() {
  const queryClient = useQueryClient();
  
  // Use Dexie live query to get clients
  const clients = useLiveQuery(async () => {
    try {
      // Ensure the clients table is accessible
      if (!db.clients) {
        await ensureClientsTable();
      }
      
      return await db.clients.toArray();
    } catch (error) {
      console.error('Error fetching clients:', error);
      return [];
    }
  }, []);
  
  // Create a new client
  const createClient = useMutation({
    mutationFn: async (data) => {
      // Ensure clients table exists
      if (!db.clients) {
        await ensureClientsTable();
      }
      
      const newClient = {
        id: uuidv4(),
        full_name: data.full_name,
        phone: data.phone || '',
        email: data.email || '',
        notes: data.notes || '',
        created_at: new Date().toISOString(),
        total_spent: 0,
        pending_payment: 0,
        last_visit: null
      };
      
      await db.clients.add(newClient);
      return newClient;
    },
    onSuccess: () => {
      // No need to invalidate query with Dexie live query
      toast.success('Client created successfully');
    },
    onError: (error) => {
      console.error('Failed to create client:', error);
      toast.error('Failed to create client');
    },
  });
  
  // Update client data
  const updateClient = useMutation({
    mutationFn: async (data) => {
      // Ensure clients table exists
      if (!db.clients) {
        await ensureClientsTable();
      }
      
      const { id, ...updates } = data;
      const existingClient = await db.clients.get(id);
      
      if (!existingClient) {
        throw new Error('Client not found');
      }
      
      await db.clients.update(id, updates);
      return { ...existingClient, ...updates };
    },
    onSuccess: () => {
      // No need to invalidate query with Dexie live query
      toast.success('Client updated successfully');
    },
    onError: (error) => {
      console.error('Failed to update client:', error);
      toast.error('Failed to update client');
    },
  });
  
  // Update or create client based on order data
  const updateClientFromOrder = async (clientName, orderTotal, paymentMethod, orderDate) => {
    try {
      // Ensure clients table exists
      if (!db.clients) {
        await ensureClientsTable();
      }
      
      // Find client by name (case insensitive)
      const client = await db.clients
        .where('full_name')
        .equalsIgnoreCase(clientName)
        .first();
      
      if (client) {
        // Update existing client
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
        
        await db.clients.update(client.id, updatedClient);
        return updatedClient;
      } else {
        // Create new client
        const newClient = {
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
        
        await db.clients.add(newClient);
        return newClient;
      }
    } catch (error) {
      console.error('Error updating client from order:', error);
      toast.error('Failed to update client information');
      throw error;
    }
  };
  
  // Process payment for pending BNPL amount
  const processPendingPayment = useMutation({
    mutationFn: async ({ clientId, amount }) => {
      // Ensure clients table exists
      if (!db.clients) {
        await ensureClientsTable();
      }
      
      const client = await db.clients.get(clientId);
      
      if (!client) {
        throw new Error('Client not found');
      }
      
      if (amount > client.pending_payment) {
        throw new Error('Payment amount exceeds pending amount');
      }
      
      const updatedClient = {
        ...client,
        pending_payment: client.pending_payment - amount,
        total_spent: client.total_spent + amount
      };
      
      await db.clients.update(clientId, updatedClient);
      return updatedClient;
    },
    onSuccess: () => {
      // No need to invalidate query with Dexie live query
      toast.success('Payment processed successfully');
    },
    onError: (error) => {
      console.error('Failed to process payment:', error);
      toast.error(`Failed to process payment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    },
  });
  
  return {
    clients,
    isLoading: clients === undefined,
    createClient: createClient.mutate,
    updateClient: updateClient.mutate,
    updateClientFromOrder,
    processPendingPayment: processPendingPayment.mutate,
  };
}
