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

export const GoogleApiConfig = {
  // Get Google API Client ID from environment variables
  CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
  
  // Get Google API Key from environment variables
  API_KEY: import.meta.env.VITE_GOOGLE_API_KEY || '',
  
  // Calendar settings
  CALENDAR_ID: 'primary', // Use 'primary' for the user's primary calendar
  
  // Calendar colors for different appointment types
  COLORS: {
    DEFAULT: '1', // Blue
    HAIRCUT: '2', // Green
    COLOR: '3', // Purple
    STYLING: '4', // Red
    SPECIAL: '11', // Yellow
  }
}; 