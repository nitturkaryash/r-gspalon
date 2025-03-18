import { useLiveQuery } from 'dexie-react-hooks';
import { db, Client } from '../db/database';
import { useState } from 'react';

export const useDexieClients = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Use Dexie's live query for real-time updates
  const clients = useLiveQuery(() => db.clients.toArray());

  // Get a specific client with live updates
  const getById = (id: string) => {
    return useLiveQuery(() => db.clients.get(id), [id]);
  };

  // Search clients by name or phone number
  const searchClients = (query: string) => {
    return useLiveQuery(() => {
      const searchTerm = query.toLowerCase();
      return db.clients
        .filter(client => 
          client.name.toLowerCase().includes(searchTerm) ||
          (client.mobile_number && client.mobile_number.includes(searchTerm))
        )
        .toArray();
    }, [query]);
  };

  // Create or update client with POS sync
  const upsertClient = async (clientData: Omit<Client, 'id'> & { id?: string }) => {
    setIsLoading(true);
    setError(null);
    try {
      // First, try to sync with POS
      const posResponse = await syncClientWithPOS(clientData);
      
      // If we have a POS ID, include it in our database
      const clientToSave = {
        ...clientData,
        pos_id: posResponse?.pos_id,
        last_synced: new Date().toISOString()
      };

      let id: string;
      if (clientData.id) {
        // Update existing client
        await db.clients.update(clientData.id, clientToSave);
        id = clientData.id;
      } else {
        // Create new client
        id = await db.clients.add(clientToSave as Client);
      }

      return { id, ...clientToSave };
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      // Even if POS sync fails, we still want to save locally
      if (!clientData.id) {
        const id = await db.clients.add(clientData as Client);
        return { id, ...clientData, sync_failed: true };
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Sync client with POS
  const syncClientWithPOS = async (clientData: Partial<Client>) => {
    try {
      // Make API call to your POS system
      const response = await fetch('/api/pos/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clientData),
      });

      if (!response.ok) {
        throw new Error('Failed to sync client with POS');
      }

      return await response.json();
    } catch (error) {
      console.error('POS sync failed:', error);
      throw error;
    }
  };

  // Retry failed syncs
  const retryFailedSyncs = async () => {
    const failedSyncs = await db.clients
      .filter(client => client.sync_failed)
      .toArray();

    const results = await Promise.allSettled(
      failedSyncs.map(client => syncClientWithPOS(client))
    );

    // Update successful syncs
    const updates = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return db.clients.update(failedSyncs[index].id, {
          pos_id: result.value.pos_id,
          sync_failed: false,
          last_synced: new Date().toISOString()
        });
      }
      return Promise.resolve();
    });

    await Promise.all(updates);
  };

  return {
    clients,
    isLoading,
    error,
    getById,
    searchClients,
    upsertClient,
    retryFailedSyncs
  };
}; 