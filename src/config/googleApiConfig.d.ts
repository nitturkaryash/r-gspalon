/**
 * Google API configuration
 *
 * To use Google Calendar integration:
 * 1. Go to Google Cloud Console (https://console.cloud.google.com/)
 * 2. Create a new project
 * 3. Enable the Google Calendar API
 * 4. Create OAuth credentials for a Web Application
 * 5. Add your application's domain to the authorized JavaScript origins
 * 6. Add your redirect URL to authorized redirect URIs
 * 7. Copy the Client ID and API Key to your .env file:
 *    VITE_GOOGLE_API_KEY=your_api_key_here
 *    VITE_GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
 */
export declare const GoogleApiConfig: {
    CLIENT_ID: any;
    API_KEY: any;
    CALENDAR_ID: string;
    COLORS: {
        DEFAULT: string;
        HAIRCUT: string;
        COLOR: string;
        STYLING: string;
        SPECIAL: string;
    };
};
