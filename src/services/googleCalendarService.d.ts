export interface CalendarEvent {
    id?: string;
    summary: string;
    description: string;
    location?: string;
    start: {
        dateTime: string;
        timeZone: string;
    };
    end: {
        dateTime: string;
        timeZone: string;
    };
    attendees?: {
        email: string;
        name?: string;
    }[];
    colorId?: string;
}
export declare class GoogleCalendarService {
    private clientId;
    private apiKey;
    private tokenClient;
    private gapiInited;
    private gisInited;
    private isAuthorized;
    constructor(clientId?: string, apiKey?: string);
    /**
     * Initialize the Google API client with authentication
     */
    init(): Promise<void>;
    /**
     * Authorize the user to access their Google Calendar
     */
    authorize(): Promise<void>;
    /**
     * Sign out the user from Google Calendar
     */
    signOut(): void;
    /**
     * Check if the user is authorized with Google Calendar
     */
    isUserAuthorized(): boolean;
    /**
     * List upcoming events from the user's calendar
     */
    listEvents(calendarId?: string, maxResults?: number): Promise<any[]>;
    /**
     * Create a new event in Google Calendar
     */
    createEvent(event: CalendarEvent, calendarId?: string): Promise<any>;
    /**
     * Update an existing event in Google Calendar
     */
    updateEvent(eventId: string, event: CalendarEvent, calendarId?: string): Promise<any>;
    /**
     * Delete an event from Google Calendar
     */
    deleteEvent(eventId: string, calendarId?: string): Promise<void>;
    /**
     * Convert a salon appointment to a Google Calendar event
     */
    convertAppointmentToEvent(appointment: any, service: any, stylist: any): CalendarEvent;
    /**
     * Sync a salon appointment with Google Calendar
     */
    syncAppointment(appointment: any, service: any, stylist: any): Promise<string>;
    /**
     * Load a script dynamically
     */
    private loadScript;
}
export declare const googleCalendarService: GoogleCalendarService;
