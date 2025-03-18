import { useLiveQuery } from 'dexie-react-hooks';
import { db, Service, ServiceCollection } from '../db/database';
import { serviceService } from '../services/serviceService';
import { useState } from 'react';

export const useDexieServices = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Use Dexie's live query for real-time updates
  const services = useLiveQuery(() => db.services.toArray());

  // Get a specific service with live updates
  const getById = (id: string) => {
    return useLiveQuery(() => db.services.get(id), [id]);
  };

  // Create a new service
  const createService = async (service: Omit<Service, 'id'>) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await serviceService.create(service);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Update a service
  const updateService = async (service: Partial<Service> & { id: string }) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await serviceService.update(service.id, service);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a service
  const deleteService = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await serviceService.delete(id);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    services,
    isLoading,
    error,
    getById,
    createService,
    updateService,
    deleteService
  };
}; 