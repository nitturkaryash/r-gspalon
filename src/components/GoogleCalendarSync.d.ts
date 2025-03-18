interface GoogleCalendarSyncProps {
    appointments: any[];
    services: any[];
    stylists: any[];
    onSyncComplete?: (appointmentId: string, googleCalendarId: string) => Promise<void>;
}
export default function GoogleCalendarSync({ appointments, services, stylists, onSyncComplete }: GoogleCalendarSyncProps): import("react/jsx-runtime").JSX.Element;
export {};
