import { useLiveQuery } from 'dexie-react-hooks';
import { db, Appointment } from '../db/database';
import { appointmentService } from '../services/appointmentService';
import { useState } from 'react';

export interface AppointmentCreate {
  stylist_id: string;
  service_id: string;
  client_id?: string;
  client_name: string;
  start_time: string;
  end_time: string;
  status: string;
  notes?: string;
  mobile_number?: string;
}

export const useDexieAppointments = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Use Dexie's live query for real-time updates
  const appointments = useLiveQuery(() => db.appointments.toArray());

  // Get appointments in a date range with live updates
  const getByDateRange = (startDate: Date, endDate: Date) => {
    return useLiveQuery(async () => {
      const startISO = startDate.toISOString();
      const endISO = endDate.toISOString();
      
      return await db.appointments
        .filter(appointment => 
          appointment.start_time >= startISO && 
          appointment.start_time <= endISO
        )
        .toArray();
    }, [startDate.toISOString(), endDate.toISOString()]);
  };

  // Get appointments for a specific stylist with live updates
  const getByStylist = (stylistId: string) => {
    return useLiveQuery(() => 
      db.appointments
        .where('stylist_id')
        .equals(stylistId)
        .toArray()
    , [stylistId]);
  };

  // Create a new appointment
  const createAppointment = async (appointment: AppointmentCreate) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await appointmentService.create(appointment);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Update an appointment
  const updateAppointment = async (appointment: Partial<Appointment> & { id: string }) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await appointmentService.update(appointment.id, appointment);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Delete an appointment
  const deleteAppointment = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await appointmentService.delete(id);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Change appointment status
  const changeAppointmentStatus = async (id: string, status: 'scheduled' | 'completed' | 'cancelled') => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await appointmentService.changeStatus(id, status);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    appointments,
    isLoading,
    error,
    getByDateRange,
    getByStylist,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    changeAppointmentStatus
  };
}; 