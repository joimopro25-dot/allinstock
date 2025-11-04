/**
 * Gmail Integration Service
 * Uses Google Identity Services (GIS) - the new OAuth library
 *
 * Setup Required:
 * 1. Create project in Google Cloud Console
 * 2. Enable Gmail API
 * 3. Create OAuth 2.0 credentials
 * 4. Add authorized redirect URI: http://localhost:5174/email-hub
 */

// Google Cloud OAuth credentials
const GMAIL_CONFIG = {
  clientId: '842871801549-3gg0vhapqn3rs5v3b6cd7lhkhgui0rta.apps.googleusercontent.com',
  apiKey: 'AIzaSyCwIve4PFG6i7jkPV-2Hxq4s0eJtF2CG2M',
  scopes: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send'
};

class GmailIntegration {
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

      // Load Google API script (for Gmail API calls)
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
   * Initialize gapi client
   */
  async gapiLoaded() {
    return new Promise((resolve, reject) => {
      window.gapi.load('client', async () => {
        try {
          await window.gapi.client.init({
            apiKey: GMAIL_CONFIG.apiKey,
            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest']
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
      client_id: GMAIL_CONFIG.clientId,
      scope: GMAIL_CONFIG.scopes,
      callback: '', // Will be set in signIn()
    });
    this.gisInited = true;
  }

  /**
   * Sign in to Gmail using Google Identity Services
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
      // Use Gmail API to get user profile
      const response = await window.gapi.client.gmail.users.getProfile({
        userId: 'me'
      });

      return {
        email: response.result.emailAddress,
        name: response.result.emailAddress.split('@')[0], // Use part before @
        imageUrl: null // GIS doesn't provide profile image easily
      };
    } catch (error) {
      console.error('Error getting user info:', error);
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
   * Sign out of Gmail
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
   * Fetch emails from Gmail
   */
  async fetchEmails(maxResults = 100, pageToken = null) {
    if (!this.accessToken) {
      throw new Error('Not authorized. Please sign in first.');
    }

    try {
      const request = {
        userId: 'me',
        maxResults: maxResults
      };

      if (pageToken) {
        request.pageToken = pageToken;
      }

      const response = await window.gapi.client.gmail.users.messages.list(request);
      const messages = response.result.messages || [];

      // Fetch full details for each message
      const emailPromises = messages.map(msg =>
        this.getEmailDetails(msg.id)
      );

      const emails = await Promise.all(emailPromises);

      return {
        emails: emails.filter(email => email !== null),
        nextPageToken: response.result.nextPageToken
      };
    } catch (error) {
      console.error('Error fetching emails:', error);
      throw error;
    }
  }

  /**
   * Get email details
   */
  async getEmailDetails(messageId) {
    try {
      const response = await window.gapi.client.gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full'
      });

      const message = response.result;
      const headers = message.payload.headers;

      // Extract email data
      const getHeader = (name) => {
        const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
        return header ? header.value : '';
      };

      const subject = getHeader('Subject');
      const from = getHeader('From');
      const to = getHeader('To');
      const cc = getHeader('Cc');
      const date = getHeader('Date');

      // Extract body
      let body = '';
      if (message.payload.body.data) {
        body = atob(message.payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
      } else if (message.payload.parts) {
        const textPart = message.payload.parts.find(part => part.mimeType === 'text/plain');
        if (textPart && textPart.body.data) {
          body = atob(textPart.body.data.replace(/-/g, '+').replace(/_/g, '/'));
        }
      }

      return {
        messageId: message.id,
        threadId: message.threadId,
        subject,
        from: this.extractEmail(from),
        fromName: this.extractName(from),
        to: this.parseEmailList(to),
        cc: this.parseEmailList(cc),
        date: new Date(date).toISOString(),
        body: body.substring(0, 1000), // Limit body size
        snippet: message.snippet,
        labels: message.labelIds || [],
        hasAttachments: message.payload.parts?.some(part => part.filename) || false
      };
    } catch (error) {
      console.error('Error getting email details:', error);
      return null;
    }
  }

  /**
   * Send email via Gmail
   */
  async sendEmail({ to, subject, body, cc = [], bcc = [] }) {
    if (!this.accessToken) {
      throw new Error('Not authorized. Please sign in first.');
    }

    try {
      const email = [
        `To: ${to}`,
        cc.length > 0 ? `Cc: ${cc.join(', ')}` : '',
        bcc.length > 0 ? `Bcc: ${bcc.join(', ')}` : '',
        `Subject: ${subject}`,
        '',
        body
      ].filter(line => line).join('\r\n');

      const encodedEmail = btoa(email).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

      const response = await window.gapi.client.gmail.users.messages.send({
        userId: 'me',
        resource: {
          raw: encodedEmail
        }
      });

      return response.result;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  /**
   * Helper: Extract email from "Name <email@example.com>" format
   */
  extractEmail(emailString) {
    if (!emailString) return '';
    const match = emailString.match(/<(.+?)>/);
    return match ? match[1] : emailString;
  }

  /**
   * Helper: Extract name from "Name <email@example.com>" format
   */
  extractName(emailString) {
    if (!emailString) return '';
    const match = emailString.match(/^(.+?)\s*</);
    return match ? match[1].replace(/"/g, '') : '';
  }

  /**
   * Helper: Parse comma-separated email list
   */
  parseEmailList(emailString) {
    if (!emailString) return [];
    return emailString
      .split(',')
      .map(e => this.extractEmail(e.trim()))
      .filter(e => e);
  }
}

export const gmailIntegration = new GmailIntegration();
