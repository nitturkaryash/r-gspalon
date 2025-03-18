import { GoogleApiConfig } from '../config/googleApiConfig';
// Constants
const SCOPES = ['https://www.googleapis.com/auth/calendar'];
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
// Main Google Calendar Service
export class GoogleCalendarService {
    constructor(clientId = GoogleApiConfig.CLIENT_ID, apiKey = GoogleApiConfig.API_KEY) {
        Object.defineProperty(this, "clientId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: clientId
        });
        Object.defineProperty(this, "apiKey", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: apiKey
        });
        Object.defineProperty(this, "tokenClient", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "gapiInited", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "gisInited", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "isAuthorized", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
    }
    /**
     * Initialize the Google API client with authentication
     */
    async init() {
        try {
            // Load gapi script
            if (!this.gapiInited) {
                await this.loadScript('https://apis.google.com/js/api.js');
                await new Promise((resolve, reject) => {
                    gapi.load('client', {
                        callback: () => resolve(),
                        onerror: () => reject(new Error('Failed to load gapi client')),
                    });
                });
                await gapi.client.init({
                    apiKey: this.apiKey,
                    discoveryDocs: [DISCOVERY_DOC],
                });
                this.gapiInited = true;
            }
            // Load gis script
            if (!this.gisInited) {
                await this.loadScript('https://accounts.google.com/gsi/client');
                this.tokenClient = google.accounts.oauth2.initTokenClient({
                    client_id: this.clientId,
                    scope: SCOPES.join(' '),
                    callback: '', // Will be set later
                });
                this.gisInited = true;
            }
            console.log('Google Calendar API initialized successfully');
        }
        catch (error) {
            console.error('Error initializing Google Calendar API:', error);
            throw error;
        }
    }
    /**
     * Authorize the user to access their Google Calendar
     */
    authorize() {
        return new Promise((resolve, reject) => {
            try {
                this.tokenClient.callback = async (resp) => {
                    if (resp.error) {
                        reject(resp);
                        return;
                    }
                    this.isAuthorized = true;
                    resolve();
                };
                if (gapi.client.getToken() === null) {
                    // Prompt the user to select a Google Account and ask for consent
                    this.tokenClient.requestAccessToken({ prompt: 'consent' });
                }
                else {
                    // Skip display of account picker for subsequent authorizations
                    this.tokenClient.requestAccessToken({ prompt: '' });
                }
            }
            catch (error) {
                console.error('Authorization error:', error);
                reject(error);
            }
        });
    }
    /**
     * Sign out the user from Google Calendar
     */
    signOut() {
        const token = gapi.client.getToken();
        if (token !== null) {
            google.accounts.oauth2.revoke(token.access_token);
            gapi.client.setToken(null);
            this.isAuthorized = false;
        }
    }
    /**
     * Check if the user is authorized with Google Calendar
     */
    isUserAuthorized() {
        return this.isAuthorized;
    }
    /**
     * List upcoming events from the user's calendar
     */
    async listEvents(calendarId = 'primary', maxResults = 10) {
        try {
            const timeMin = new Date();
            const timeMax = new Date();
            timeMax.setDate(timeMax.getDate() + 30); // Next 30 days
            const response = await gapi.client.calendar.events.list({
                calendarId,
                timeMin: timeMin.toISOString(),
                timeMax: timeMax.toISOString(),
                showDeleted: false,
                singleEvents: true,
                maxResults,
                orderBy: 'startTime',
            });
            return response.result.items || [];
        }
        catch (error) {
            console.error('Error fetching events:', error);
            throw error;
        }
    }
    /**
     * Create a new event in Google Calendar
     */
    async createEvent(event, calendarId = 'primary') {
        try {
            const response = await gapi.client.calendar.events.insert({
                calendarId,
                resource: event,
            });
            return response.result;
        }
        catch (error) {
            console.error('Error creating event:', error);
            throw error;
        }
    }
    /**
     * Update an existing event in Google Calendar
     */
    async updateEvent(eventId, event, calendarId = 'primary') {
        try {
            const response = await gapi.client.calendar.events.update({
                calendarId,
                eventId,
                resource: event,
            });
            return response.result;
        }
        catch (error) {
            console.error('Error updating event:', error);
            throw error;
        }
    }
    /**
     * Delete an event from Google Calendar
     */
    async deleteEvent(eventId, calendarId = 'primary') {
        try {
            await gapi.client.calendar.events.delete({
                calendarId,
                eventId,
            });
        }
        catch (error) {
            console.error('Error deleting event:', error);
            throw error;
        }
    }
    /**
     * Convert a salon appointment to a Google Calendar event
     */
    convertAppointmentToEvent(appointment, service, stylist) {
        const startTime = new Date(appointment.start_time);
        const endTime = new Date(appointment.end_time);
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        return {
            summary: `${appointment.clients?.full_name || 'Client'} - ${service?.name || 'Appointment'}`,
            description: `Stylist: ${stylist?.name || 'Unknown'}\nService: ${service?.name || 'Unknown'}\n${appointment.notes || ''}`,
            location: 'Salon', // You can customize this
            start: {
                dateTime: startTime.toISOString(),
                timeZone,
            },
            end: {
                dateTime: endTime.toISOString(),
                timeZone,
            },
            attendees: appointment.clients?.email ? [
                { email: appointment.clients.email, name: appointment.clients.full_name }
            ] : undefined,
            colorId: '7', // Light blue color
        };
    }
    /**
     * Sync a salon appointment with Google Calendar
     */
    async syncAppointment(appointment, service, stylist) {
        try {
            const event = this.convertAppointmentToEvent(appointment, service, stylist);
            // If the appointment already has a Google Calendar ID, update it
            if (appointment.googleCalendarId) {
                await this.updateEvent(appointment.googleCalendarId, event);
                return appointment.googleCalendarId;
            }
            // Otherwise create a new event
            else {
                const createdEvent = await this.createEvent(event);
                return createdEvent.id;
            }
        }
        catch (error) {
            console.error('Error syncing appointment with Google Calendar:', error);
            throw error;
        }
    }
    /**
     * Load a script dynamically
     */
    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
            document.head.appendChild(script);
        });
    }
}
// Export a singleton instance
export const googleCalendarService = new GoogleCalendarService();
