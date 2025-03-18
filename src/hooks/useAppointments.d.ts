export interface Appointment {
    id: string;
    client_id?: string;
    clients?: any;
    stylist_id: string;
    service_id: string;
    start_time: string;
    end_time: string;
    notes?: string;
    status: 'scheduled' | 'completed' | 'cancelled';
    googleCalendarId?: string;
}
interface CreateAppointmentData {
    stylist_id: string;
    service_id: string;
    client_name: string;
    start_time: string;
    end_time: string;
    status: 'scheduled' | 'completed' | 'cancelled';
    notes?: string;
    client_id?: string;
    phone?: string;
    email?: string;
}
export declare function useAppointments(): {
    appointments: any;
    isLoading: boolean;
    createAppointment: import("@tanstack/react-query").UseMutateFunction<{
        id: string;
        client_id: string;
        stylist_id: string;
        service_id: string;
        start_time: any;
        end_time: any;
        status: "completed" | "cancelled" | "scheduled";
        notes: string;
        paid: boolean;
        clients: {
            full_name: string;
        };
        stylists: {
            name: string;
        };
        services: {
            name: string;
        };
    }, Error, CreateAppointmentData, unknown>;
    updateAppointment: import("@tanstack/react-query").UseMutateFunction<any, Error, Partial<Appointment> & {
        id: string;
    }, unknown>;
    deleteAppointment: import("@tanstack/react-query").UseMutateFunction<{
        success: boolean;
    }, Error, string, unknown>;
    updateAppointmentGoogleCalendarId: import("@tanstack/react-query").UseMutateFunction<any, Error, {
        appointmentId: string;
        googleCalendarId: string;
    }, unknown>;
};
export {};
