# Gmail OAuth Error - Complete Solution

## The Problem

You were getting this error when clicking "Connect Gmail":

```
Error: idpiframe_initialization_failed
Details: "You have created a new client application that uses libraries for user
authentication or authorization that are deprecated. New clients must use the
new libraries instead."
```

## The Root Cause

Google **deprecated the old `gapi.auth2` OAuth library** for new applications. Any OAuth client created after 2023 must use the new **Google Identity Services (GIS)** library instead.

The old code was trying to use:
```javascript
// OLD - DEPRECATED
window.gapi.auth2.getAuthInstance().signIn()
```

But Google now requires:
```javascript
// NEW - REQUIRED
window.google.accounts.oauth2.initTokenClient()
```

## The Solution

I completely **rewrote the Gmail integration** to use Google Identity Services (GIS).

### What Changed

**File: [src/services/gmailIntegration.js](src/services/gmailIntegration.js)**

#### Old Implementation (Deprecated):
```javascript
// Load gapi with auth2
window.gapi.load('client:auth2', async () => {
  await window.gapi.client.init({
    apiKey: GMAIL_CONFIG.apiKey,
    clientId: GMAIL_CONFIG.clientId,
    scope: GMAIL_CONFIG.scopes
  });
});

// Sign in
await window.gapi.auth2.getAuthInstance().signIn();
```

#### New Implementation (Google Identity Services):
```javascript
// Load gapi (just client, NO auth2)
window.gapi.load('client', async () => {
  await window.gapi.client.init({
    apiKey: GMAIL_CONFIG.apiKey,
    // No clientId here - that's handled by GIS
  });
});

// Load GIS separately
const gisScript = document.createElement('script');
gisScript.src = 'https://accounts.google.com/gsi/client';

// Initialize token client
this.tokenClient = window.google.accounts.oauth2.initTokenClient({
  client_id: GMAIL_CONFIG.clientId,
  scope: GMAIL_CONFIG.scopes,
  callback: (response) => {
    this.accessToken = response.access_token;
    window.gapi.client.setToken({ access_token: this.accessToken });
  }
});

// Sign in - opens popup
this.tokenClient.requestAccessToken({ prompt: 'consent' });
```

### Key Differences

| Old (gapi.auth2) | New (GIS) |
|------------------|-----------|
| Single library | Two libraries: `gapi` (for API calls) + `GIS` (for auth) |
| `client:auth2` | `client` only |
| `gapi.auth2.getAuthInstance()` | `google.accounts.oauth2.initTokenClient()` |
| Sign-in integrated | Sign-in separate |
| Profile API available | Must use Gmail API for profile |

## How to Test

### 1. Refresh the Page
The code has been updated. Simply **refresh** your browser at:
```
http://localhost:5174/email-hub
```

Or restart the dev server:
```bash
npm run dev
```

### 2. Click "Connect Gmail"
Click the "Connect Gmail" button in the Email Hub.

### 3. Expected Flow
1. **Google popup opens** (if blocked, check popup settings)
2. **Select your Google account**: `allinstockpro@gmail.com`
3. **See warning**: "Google hasn't verified this app" (normal in testing mode)
   - Click **"Continue"**
4. **Grant permissions** screen
   - Shows: "See, edit, create, and delete all of your Google Gmail data"
   - Click **"Allow"**
5. **Popup closes automatically**
6. **Email Hub updates** - shows your email as connected

### 4. Success Indicators
✅ No more `idpiframe_initialization_failed` error
✅ Popup opens (not blocked)
✅ Can select account
✅ Permissions granted
✅ Email Hub shows "Connected" status
✅ "Sync Emails" button is enabled

## Troubleshooting

### Error: "Popup blocked"
**Solution**: Allow popups for `localhost:5174` in your browser settings

### Error: "Access denied" or "unauthorized"
**Solution**:
1. Make sure `allinstockpro@gmail.com` is added as a test user
2. Go to Google Cloud Console → OAuth consent screen → Test users
3. Verify your email is in the list

### Popup opens but shows error
**Solution**: Check console for specific error message. Most common:
- Wrong Client ID → Verify in `gmailIntegration.js`
- Wrong scopes → Should be `gmail.readonly` and `gmail.send`
- Account not in test users → Add it in OAuth consent screen

### "This app is in testing mode"
**This is NORMAL!** Your OAuth app is in testing mode, which is fine for development. Click **"Continue"** to proceed.

## What Happens Next

After successfully connecting:

1. ✅ **Sync Emails**: Click "Sync Emails" to import up to 200 recent emails
2. ✅ **Auto-match**: Emails automatically matched to clients/suppliers by email address
3. ✅ **View stats**: See total emails, client emails, supplier emails, unmatched
4. ✅ **Email history**: (Coming soon) View email threads in client/supplier detail pages

## Technical Details

### Libraries Used
1. **Google API Client** (`gapi`)
   - Purpose: Make Gmail API calls (list messages, get message, send)
   - Loaded from: `https://apis.google.com/js/api.js`
   - Initialized with API key only

2. **Google Identity Services** (`GIS`)
   - Purpose: OAuth authentication and token management
   - Loaded from: `https://accounts.google.com/gsi/client`
   - Initialized with Client ID and scopes

### Authentication Flow
```
User clicks "Connect Gmail"
    ↓
Initialize GIS token client
    ↓
Request access token (opens popup)
    ↓
User grants permissions
    ↓
Receive access token
    ↓
Set token in gapi client
    ↓
Call Gmail API to get user profile
    ↓
Display connected status
```

### Token Management
- **Access token** stored in memory (`this.accessToken`)
- **Automatically used** for all Gmail API calls
- **Revoked** on sign-out
- **Not persisted** - user must sign in each session

## Migration Guide (for other developers)

If you're migrating from `gapi.auth2` to GIS:

### Step 1: Update Initialization
```diff
- window.gapi.load('client:auth2', ...)
+ window.gapi.load('client', ...)
```

### Step 2: Remove auth2 from gapi.client.init
```diff
await window.gapi.client.init({
  apiKey: API_KEY,
-  clientId: CLIENT_ID,
-  scope: SCOPES
});
```

### Step 3: Load GIS Script
```javascript
const gisScript = document.createElement('script');
gisScript.src = 'https://accounts.google.com/gsi/client';
document.body.appendChild(gisScript);
```

### Step 4: Initialize Token Client
```javascript
this.tokenClient = window.google.accounts.oauth2.initTokenClient({
  client_id: CLIENT_ID,
  scope: SCOPES,
  callback: (response) => {
    if (response.error) {
      // Handle error
      return;
    }
    this.accessToken = response.access_token;
    window.gapi.client.setToken({ access_token: this.accessToken });
  }
});
```

### Step 5: Request Token
```javascript
// Replace gapi.auth2.getAuthInstance().signIn()
this.tokenClient.requestAccessToken({ prompt: 'consent' });
```

### Step 6: Sign Out
```javascript
// Replace gapi.auth2.getAuthInstance().signOut()
window.google.accounts.oauth2.revoke(this.accessToken, () => {
  this.accessToken = null;
  window.gapi.client.setToken(null);
});
```

## References

- [Google Identity Services Documentation](https://developers.google.com/identity/gsi/web/guides/overview)
- [Migration from Google Sign-In](https://developers.google.com/identity/gsi/web/guides/migration)
- [Gmail API Documentation](https://developers.google.com/gmail/api)
- [OAuth 2.0 for Web Applications](https://developers.google.com/identity/protocols/oauth2/web-server)

## Files Modified

1. ✅ [src/services/gmailIntegration.js](src/services/gmailIntegration.js) - Complete rewrite using GIS
2. ✅ [vite.config.js](vite.config.js) - Fixed port to 5174
3. ✅ [src/pages/emailHub/EmailHub.jsx](src/pages/emailHub/EmailHub.jsx) - Enhanced error logging
4. ✅ [FIXES_APPLIED.md](FIXES_APPLIED.md) - Documentation
5. ✅ [EMAIL_HUB_SETUP.md](EMAIL_HUB_SETUP.md) - Updated troubleshooting

## Files Created

1. ✅ [OAUTH_400_ERROR_FIX.md](OAUTH_400_ERROR_FIX.md) - Step-by-step fix guide
2. ✅ [SOLUTION_SUMMARY.md](SOLUTION_SUMMARY.md) - This file

---

## Summary

**Problem**: `idpiframe_initialization_failed` error
**Cause**: Using deprecated `gapi.auth2` library
**Solution**: Migrated to Google Identity Services (GIS)
**Status**: ✅ Fixed and ready to test

**Next step**: Refresh the page and click "Connect Gmail"!
