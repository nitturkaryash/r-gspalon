import { useLiveQuery } from 'dexie-react-hooks';
import { db, Stylist, StylistBreak } from '../db/database';
import { stylistService } from '../services/stylistService';
import { useState } from 'react';

export const useDexieStylists = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Use Dexie's live query for real-time updates
  const stylists = useLiveQuery(() => db.stylists.toArray());

  // Get a specific stylist with live updates
  const getById = (id: string) => {
    return useLiveQuery(() => db.stylists.get(id), [id]);
  };

  // Create a new stylist
  const createStylist = async (stylist: Omit<Stylist, 'id'>) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await stylistService.create(stylist);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Update a stylist
  const updateStylist = async (stylist: Partial<Stylist> & { id: string }) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await stylistService.update(stylist.id, stylist);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a stylist
  const deleteStylist = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await stylistService.delete(id);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Add a break to a stylist's schedule
  const addBreak = async (stylistId: string, breakData: Omit<StylistBreak, 'id'>) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await stylistService.addBreak(stylistId, breakData);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Remove a break from a stylist's schedule
  const removeBreak = async (stylistId: string, breakId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await stylistService.removeBreak(stylistId, breakId);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Update a stylist's break
  const updateBreak = async (stylistId: string, breakId: string, updates: Partial<StylistBreak>) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await stylistService.updateBreak(stylistId, breakId, updates);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    stylists,
    isLoading,
    error,
    getById,
    createStylist,
    updateStylist,
    deleteStylist,
    addBreak,
    removeBreak,
    updateBreak
  };
}; 