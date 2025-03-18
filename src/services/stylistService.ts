import { db, Stylist, StylistBreak } from '../db/database';
import { v4 as uuidv4 } from 'uuid';

export const stylistService = {
  // Get all stylists
  getAll: async () => {
    return await db.stylists.toArray();
  },
  
  // Get stylist by ID
  getById: async (id: string) => {
    return await db.stylists.get(id);
  },
  
  // Create a new stylist
  create: async (stylist: Omit<Stylist, 'id'>) => {
    const newStylist: Stylist = {
      ...stylist,
      id: uuidv4(),
      breaks: stylist.breaks || []
    };
    
    const id = await db.stylists.add(newStylist);
    return await db.stylists.get(id);
  },
  
  // Update an existing stylist
  update: async (id: string, updates: Partial<Stylist>) => {
    await db.stylists.update(id, updates);
    return await db.stylists.get(id);
  },
  
  // Delete a stylist
  delete: async (id: string) => {
    // You might want to check if there are related appointments first
    return await db.stylists.delete(id);
  },
  
  // Add a break to a stylist's schedule
  addBreak: async (stylistId: string, breakData: Omit<StylistBreak, 'id'>) => {
    const stylist = await db.stylists.get(stylistId);
    if (!stylist) {
      throw new Error('Stylist not found');
    }
    
    const newBreak: StylistBreak = {
      ...breakData,
      id: uuidv4()
    };
    
    const updatedBreaks = [...(stylist.breaks || []), newBreak];
    
    await db.stylists.update(stylistId, { breaks: updatedBreaks });
    return await db.stylists.get(stylistId);
  },
  
  // Remove a break from a stylist's schedule
  removeBreak: async (stylistId: string, breakId: string) => {
    const stylist = await db.stylists.get(stylistId);
    if (!stylist || !stylist.breaks) {
      throw new Error('Stylist or breaks not found');
    }
    
    const updatedBreaks = stylist.breaks.filter(b => b.id !== breakId);
    
    await db.stylists.update(stylistId, { breaks: updatedBreaks });
    return await db.stylists.get(stylistId);
  },
  
  // Update a stylist's break
  updateBreak: async (stylistId: string, breakId: string, updates: Partial<StylistBreak>) => {
    const stylist = await db.stylists.get(stylistId);
    if (!stylist || !stylist.breaks) {
      throw new Error('Stylist or breaks not found');
    }
    
    const updatedBreaks = stylist.breaks.map(b => 
      b.id === breakId ? { ...b, ...updates } : b
    );
    
    await db.stylists.update(stylistId, { breaks: updatedBreaks });
    return await db.stylists.get(stylistId);
  }
}; 