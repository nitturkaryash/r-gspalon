import { useLiveQuery } from 'dexie-react-hooks';
import { db, ServiceCollection } from '../db/database';
import { collectionService } from '../services/collectionService';
import { useState } from 'react';

export const useDexieServiceCollections = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Use Dexie's live query for real-time updates
  const serviceCollections = useLiveQuery(() => db.serviceCollections.toArray());

  // Get a specific collection with live updates
  const getById = (id: string) => {
    return useLiveQuery(() => db.serviceCollections.get(id), [id]);
  };

  // Get all services for a specific collection
  const getServicesForCollection = (collectionId: string) => {
    // First attempt to fetch using live query
    console.log('Getting services for collection ID:', collectionId);
    
    // We need to handle the return value here correctly
    const result = useLiveQuery(async () => {
      try {
        console.log('Fetching collection services mappings for collection ID:', collectionId);
        
        // Get collection-service mappings for this collection
        const mappings = await db.collectionServices
          .where('collection_id')
          .equals(collectionId)
          .toArray();
          
        console.log('Found mappings:', mappings);
        
        if (mappings.length === 0) {
          console.log('No mappings found for collection ID:', collectionId);
          return [];
        }
        
        // Extract service IDs
        const serviceIds = mappings.map(m => m.service_id);
        console.log('Service IDs from mappings:', serviceIds);
        
        // Get services that match these IDs
        const services = await db.services
          .where('id')
          .anyOf(serviceIds)
          .toArray();
          
        console.log('Found services:', services);
        return services;
      } catch (err) {
        console.error('Error fetching services for collection:', err);
        return [];
      }
    }, [collectionId]);
    
    return result || [];
  };

  // Create a new collection
  const createCollection = async (collection: Omit<ServiceCollection, 'id'>) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await collectionService.create(collection);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Update a collection
  const updateCollection = async (collection: Partial<ServiceCollection> & { id: string }) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await collectionService.update(collection.id, collection);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a collection
  const deleteCollection = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await collectionService.delete(id);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Add service to collection
  const addServiceToCollection = async (collectionId: string, serviceId: string) => {
    try {
      await db.collectionServices.add({
        collection_id: collectionId,
        service_id: serviceId
      });
    } catch (err) {
      console.error('Error adding service to collection:', err);
      throw err;
    }
  };

  // Remove service from collection
  const removeServiceFromCollection = async (collectionId: string, serviceId: string) => {
    try {
      await db.collectionServices
        .where('[collection_id+service_id]')
        .equals([collectionId, serviceId])
        .delete();
    } catch (err) {
      console.error('Error removing service from collection:', err);
      throw err;
    }
  };

  return {
    serviceCollections,
    isLoading,
    error,
    getById,
    getServicesForCollection,
    createCollection,
    updateCollection,
    deleteCollection,
    addServiceToCollection,
    removeServiceFromCollection
  };
}; 