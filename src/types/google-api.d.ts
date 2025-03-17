/**
 * Type declarations for Google API
 */

// Google API namespaces
declare namespace gapi {
  namespace client {
    function init(args: { apiKey: string; discoveryDocs: string[] }): Promise<void>;
    function load(apiName: string, version: string, callback: () => void): void;
    function setToken(token: { access_token: string } | null): void;
    function getToken(): { access_token: string } | null;

    namespace calendar {
      namespace events {
        function list(params: {
          calendarId: string;
          timeMin: string;
          timeMax: string;
          showDeleted: boolean;
          singleEvents: boolean;
          maxResults: number;
          orderBy: string;
        }): Promise<{ result: { items: any[] } }>;

        function insert(params: {
          calendarId: string;
          resource: any;
        }): Promise<{ result: any }>;

        function update(params: {
          calendarId: string;
          eventId: string;
          resource: any;
        }): Promise<{ result: any }>;

        function delete(params: {
          calendarId: string;
          eventId: string;
        }): Promise<void>;
      }
    }
  }

  function load(api: string, callback: { callback: () => void; onerror: (error: Error) => void }): void;
}

// Google Identity Services
declare namespace google {
  namespace accounts {
    namespace oauth2 {
      function initTokenClient(config: {
        client_id: string;
        scope: string;
        callback: string | ((resp: any) => void);
      }): {
        requestAccessToken: (options: { prompt?: string }) => void;
      };

      function revoke(token: string): void;
    }
  }
} 