import { db, Appointment } from '../db/database';
import { v4 as uuidv4 } from 'uuid';
import { AppointmentCreate } from '../hooks/useDexieAppointments';

export const appointmentService = {
  // Get all appointments
  getAll: async () => {
    return await db.appointments.toArray();
  },
  
  // Get appointment by ID
  getById: async (id: string) => {
    return await db.appointments.get(id);
  },
  
  // Get appointments by stylist ID
  getByStylist: async (stylistId: string) => {
    return await db.appointments
      .where('stylist_id')
      .equals(stylistId)
      .toArray();
  },
  
  // Get appointments for a specific date range
  getByDateRange: async (startDate: Date, endDate: Date) => {
    const startISO = startDate.toISOString();
    const endISO = endDate.toISOString();
    
    return await db.appointments
      .filter(appointment => 
        appointment.start_time >= startISO && 
        appointment.start_time <= endISO
      )
      .toArray();
  },
  
  // Create a new appointment
  create: async (appointment: AppointmentCreate) => {
    const now = new Date().toISOString();
    const newAppointment: Appointment = {
      ...appointment,
      id: uuidv4(),
      created_at: now,
      updated_at: now
    };
    
    const id = await db.appointments.add(newAppointment);
    return await db.appointments.get(id);
  },
  
  // Update an existing appointment
  update: async (id: string, updates: Partial<Appointment>) => {
    const now = new Date().toISOString();
    await db.appointments.update(id, {
      ...updates,
      updated_at: now
    });
    
    return await db.appointments.get(id);
  },
  
  // Delete an appointment
  delete: async (id: string) => {
    return await db.appointments.delete(id);
  },
  
  // Change appointment status
  changeStatus: async (id: string, status: 'scheduled' | 'completed' | 'cancelled') => {
    const now = new Date().toISOString();
    await db.appointments.update(id, { 
      status, 
      updated_at: now 
    });
    
    return await db.appointments.get(id);
  }
}; 