/**
 * Google Calendar Integration Service
 * Uses Google Identity Services (GIS) for OAuth
 *
 * Setup Required:
 * 1. Use same Google Cloud project as Gmail
 * 2. Enable Google Calendar API
 * 3. Add Calendar scope to OAuth consent screen
 * 4. Use same OAuth 2.0 client credentials
 */

// Google Cloud OAuth credentials (same as Gmail)
const CALENDAR_CONFIG = {
  clientId: '842871801549-3gg0vhapqn3rs5v3b6cd7lhkhgui0rta.apps.googleusercontent.com',
  apiKey: 'AIzaSyCwIve4PFG6i7jkPV-2Hxq4s0eJtF2CG2M',
  scopes: 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events'
};

class CalendarIntegration {
  constructor() {
    this.isInitialized = false;
    this.accessToken = null;
    this.tokenClient = null;
    this.gapiInited = false;
    this.gisInited = false;
    this.userEmail = null;
  }

  /**
   * Initialize Google API Client and Google Identity Services
   */
  async initialize() {
    return new Promise((resolve, reject) => {
      let gapiResolved = false;
      let gisResolved = false;

      const checkBothLoaded = () => {
        if (gapiResolved && gisResolved) {
          this.isInitialized = true;
          resolve(true);
        }
      };

      // Load Google API script (for Calendar API calls)
      if (!window.gapi) {
        const gapiScript = document.createElement('script');
        gapiScript.src = 'https://apis.google.com/js/api.js';
        gapiScript.onload = () => {
          this.gapiLoaded().then(() => {
            gapiResolved = true;
            checkBothLoaded();
          }).catch(reject);
        };
        gapiScript.onerror = reject;
        document.body.appendChild(gapiScript);
      } else if (!this.gapiInited) {
        this.gapiLoaded().then(() => {
          gapiResolved = true;
          checkBothLoaded();
        }).catch(reject);
      } else {
        gapiResolved = true;
        checkBothLoaded();
      }

      // Load Google Identity Services script (for OAuth)
      if (!window.google?.accounts?.oauth2) {
        const gisScript = document.createElement('script');
        gisScript.src = 'https://accounts.google.com/gsi/client';
        gisScript.onload = () => {
          this.gisLoaded();
          gisResolved = true;
          checkBothLoaded();
        };
        gisScript.onerror = reject;
        document.body.appendChild(gisScript);
      } else if (!this.gisInited) {
        this.gisLoaded();
        gisResolved = true;
        checkBothLoaded();
      } else {
        gisResolved = true;
        checkBothLoaded();
      }
    });
  }

  /**
   * Initialize gapi client for Calendar API
   */
  async gapiLoaded() {
    return new Promise((resolve, reject) => {
      window.gapi.load('client', async () => {
        try {
          await window.gapi.client.init({
            apiKey: CALENDAR_CONFIG.apiKey,
            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest']
          });
          this.gapiInited = true;
          resolve(true);
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  /**
   * Initialize Google Identity Services
   */
  gisLoaded() {
    this.tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CALENDAR_CONFIG.clientId,
      scope: CALENDAR_CONFIG.scopes,
      callback: '', // Will be set in signIn()
    });
    this.gisInited = true;
  }

  /**
   * Sign in to Google Calendar using Google Identity Services
   */
  async signIn() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      try {
        // Set the callback for token response
        this.tokenClient.callback = async (response) => {
          if (response.error !== undefined) {
            reject(response);
            return;
          }

          // Store access token
          this.accessToken = response.access_token;

          // Set the token for gapi client
          window.gapi.client.setToken({
            access_token: this.accessToken
          });

          // Get user info
          try {
            const userInfo = await this.getUserInfo();
            this.userEmail = userInfo.email;
            resolve(userInfo);
          } catch (error) {
            reject(error);
          }
        };

        // Check if user already has a token
        if (this.accessToken) {
          // Token exists, just get user info
          this.getUserInfo().then(userInfo => {
            resolve(userInfo);
          }).catch(reject);
        } else {
          // Request the token - this will open Google sign-in popup
          this.tokenClient.requestAccessToken({ prompt: 'consent' });
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Get current user information
   */
  async getUserInfo() {
    if (!this.accessToken) {
      return null;
    }

    try {
      // Use Calendar API to get calendar list (to verify access)
      const response = await window.gapi.client.calendar.calendarList.list({
        maxResults: 1
      });

      // Extract email from primary calendar
      const primaryCalendar = response.result.items?.find(cal => cal.primary) || response.result.items?.[0];

      return {
        email: primaryCalendar?.id || this.userEmail || 'unknown',
        name: primaryCalendar?.summary || 'Calendar User',
        imageUrl: null
      };
    } catch (error) {
      // Only log non-401 errors (401 means expired token, handle silently)
      if (error.status !== 401) {
        console.error('Error getting user info:', error);
      }
      // Fallback: return cached info if available
      if (this.userEmail) {
        return {
          email: this.userEmail,
          name: this.userEmail.split('@')[0],
          imageUrl: null
        };
      }
      throw error;
    }
  }

  /**
   * Restore token from storage (for persistent connection)
   */
  async restoreToken(accessToken, email) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    this.accessToken = accessToken;
    this.userEmail = email;

    // Set the token for gapi client
    window.gapi.client.setToken({
      access_token: this.accessToken
    });

    return {
      email: this.userEmail,
      name: this.userEmail.split('@')[0],
      imageUrl: null
    };
  }

  /**
   * Get current user (if signed in)
   */
  getCurrentUser() {
    if (!this.accessToken || !this.userEmail) {
      return null;
    }

    return {
      email: this.userEmail,
      name: this.userEmail.split('@')[0],
      imageUrl: null
    };
  }

  /**
   * Sign out of Google Calendar
   */
  async signOut() {
    if (this.accessToken) {
      // Revoke the token
      window.google.accounts.oauth2.revoke(this.accessToken, () => {
        console.log('Token revoked');
      });

      this.accessToken = null;
      this.userEmail = null;
      window.gapi.client.setToken(null);
    }
  }

  /**
   * Fetch events from Google Calendar
   */
  async fetchEvents(timeMin = null, timeMax = null, maxResults = 250) {
    if (!this.accessToken) {
      throw new Error('Not authorized. Please sign in first.');
    }

    try {
      const now = new Date();
      const params = {
        calendarId: 'primary',
        timeMin: timeMin || new Date(now.getFullYear(), now.getMonth(), 1).toISOString(), // Start of current month
        timeMax: timeMax || new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString(), // End of current month
        maxResults: maxResults,
        singleEvents: true,
        orderBy: 'startTime'
      };

      const response = await window.gapi.client.calendar.events.list(params);
      const events = response.result.items || [];

      return events.map(event => this.parseCalendarEvent(event));
    } catch (error) {
      // Only log non-401 errors (401 means expired token, handle silently)
      if (error.status !== 401) {
        console.error('Error fetching calendar events:', error);
      }
      throw error;
    }
  }

  /**
   * Create a new event in Google Calendar
   */
  async createEvent({ summary, description, start, end, location, attendees = [] }) {
    if (!this.accessToken) {
      throw new Error('Not authorized. Please sign in first.');
    }

    try {
      const event = {
        summary,
        description,
        location,
        start: {
          dateTime: start,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        end: {
          dateTime: end,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        attendees: attendees.map(email => ({ email })),
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 1 day before
            { method: 'popup', minutes: 30 } // 30 minutes before
          ]
        }
      };

      const response = await window.gapi.client.calendar.events.insert({
        calendarId: 'primary',
        resource: event
      });

      return this.parseCalendarEvent(response.result);
    } catch (error) {
      console.error('Error creating calendar event:', error);
      throw error;
    }
  }

  /**
   * Update an existing event in Google Calendar
   */
  async updateEvent(eventId, { summary, description, start, end, location, attendees = [] }) {
    if (!this.accessToken) {
      throw new Error('Not authorized. Please sign in first.');
    }

    try {
      const event = {
        summary,
        description,
        location,
        start: {
          dateTime: start,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        end: {
          dateTime: end,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        attendees: attendees.map(email => ({ email }))
      };

      const response = await window.gapi.client.calendar.events.update({
        calendarId: 'primary',
        eventId: eventId,
        resource: event
      });

      return this.parseCalendarEvent(response.result);
    } catch (error) {
      console.error('Error updating calendar event:', error);
      throw error;
    }
  }

  /**
   * Delete an event from Google Calendar
   */
  async deleteEvent(eventId) {
    if (!this.accessToken) {
      throw new Error('Not authorized. Please sign in first.');
    }

    try {
      await window.gapi.client.calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId
      });

      return { success: true };
    } catch (error) {
      console.error('Error deleting calendar event:', error);
      throw error;
    }
  }

  /**
   * Parse Google Calendar event to our format
   */
  parseCalendarEvent(event) {
    return {
      id: event.id,
      googleEventId: event.id,
      summary: event.summary || '(No title)',
      description: event.description || '',
      location: event.location || '',
      start: event.start?.dateTime || event.start?.date,
      end: event.end?.dateTime || event.end?.date,
      attendees: event.attendees?.map(a => a.email) || [],
      htmlLink: event.htmlLink,
      status: event.status,
      created: event.created,
      updated: event.updated,
      isAllDay: !event.start?.dateTime // All-day events only have 'date', not 'dateTime'
    };
  }
}

export const calendarIntegration = new CalendarIntegration();
