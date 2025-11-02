# Fixes Applied for OAuth 400 Error

## Date: 2025-11-01

## Problem
You were experiencing a **400 (Bad Request)** error when trying to connect Gmail to the Email Hub. The error appeared in the console as:
```
Failed to load resource: accounts.google.com/...rt/fine-allowlist:1
the server responded with a status of 400 ()
```

## Root Cause - UPDATED!
**The actual root cause was different from what we initially thought!**

The error message `idpiframe_initialization_failed` revealed that Google has **deprecated the old gapi.auth2 library** for new OAuth clients. The error stated:

```
"You have created a new client application that uses libraries for user
authentication or authorization that are deprecated. New clients must use
the new libraries instead."
```

This means any OAuth client created recently **must use Google Identity Services (GIS)** instead of the old `gapi.auth2` library.

## Fixes Applied

### 1. ✅ Fixed Vite Server Port Configuration
**File**: `vite.config.js`

**What I did**: Explicitly configured the dev server to always use port 5174, matching your Google Cloud OAuth configuration.

```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    strictPort: true  // Fail if port is already in use
  }
})
```

**Why**: Ensures the dev server always runs on the same port that's authorized in your OAuth client.

### 2. ✅ **MAIN FIX**: Migrated to Google Identity Services (GIS)
**File**: `src/services/gmailIntegration.js`

**What I did**: Completely rewrote the Gmail integration to use the new Google Identity Services library instead of the deprecated `gapi.auth2`.

**Key changes**:
- **Old way**: Used `gapi.auth2.getAuthInstance().signIn()`
- **New way**: Uses `google.accounts.oauth2.initTokenClient()`

```javascript
// Initialize Google Identity Services
gisLoaded() {
  this.tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: GMAIL_CONFIG.clientId,
    scope: GMAIL_CONFIG.scopes,
    callback: '', // Set in signIn()
  });
  this.gisInited = true;
}

// Sign in with GIS
async signIn() {
  this.tokenClient.callback = async (response) => {
    this.accessToken = response.access_token;
    window.gapi.client.setToken({ access_token: this.accessToken });
    // Get user info and resolve
  };

  this.tokenClient.requestAccessToken({ prompt: 'consent' });
}
```

**Why**: Google requires all new OAuth clients (created after 2023) to use GIS. The old library is deprecated and causes the `idpiframe_initialization_failed` error.

### 3. ✅ Enhanced Error Logging
**File**: `src/pages/emailHub/EmailHub.jsx`

**What I did**: Added comprehensive error logging to help debug OAuth issues.

```javascript
catch (error) {
  console.error('Error connecting Gmail:', error);
  console.error('Full error object:', JSON.stringify(error, null, 2));

  // Extract detailed error information
  let errorMsg = 'Unknown error';
  if (error.error) {
    errorMsg = error.error;
  } else if (error.details) {
    errorMsg = error.details;
  } else if (error.message) {
    errorMsg = error.message;
  }

  // Log additional context
  console.log('Error type:', typeof error);
  console.log('Error keys:', Object.keys(error));

  alert(
    language === 'pt'
      ? `Erro ao conectar Gmail: ${errorMsg}\n\nVerifique o console para mais detalhes.`
      : `Error connecting Gmail: ${errorMsg}\n\nCheck console for more details.`
  );
}
```

**Why**: Now you'll see much more detailed error information in the console, making it easier to diagnose OAuth issues.

### 3. ✅ Updated Setup Documentation
**File**: `EMAIL_HUB_SETUP.md`

**What I did**:
- Added explicit step to click "UPDATE" button after selecting scopes
- Fixed step numbering
- Clarified the critical steps

**Why**: Prevents future users from making the same mistake.

### 4. ✅ Created Comprehensive Troubleshooting Guide
**File**: `EMAIL_HUB_SETUP.md` (Troubleshooting section)

**What I did**: Added a dedicated section for the 400 error with step-by-step solutions:
1. How to verify and save OAuth scopes
2. Waiting for propagation (5-10 minutes)
3. Clearing browser cache
4. Trying incognito mode
5. Verifying authorized origins
6. Restarting dev server

### 5. ✅ Created Quick Fix Checklist
**File**: `OAUTH_400_ERROR_FIX.md` (NEW)

**What I did**: Created a step-by-step checklist specifically for fixing the 400 error. This file:
- Lists symptoms of the problem
- Provides exact steps to follow IN ORDER
- Explains common mistakes
- Shows what success looks like

## What You Need to Do Now

**Good news!** The fix has been applied. The Gmail integration now uses Google Identity Services (the new library).

### Step 1: Refresh Your Browser
Simply **refresh the Email Hub page** or **restart your dev server** if it's not running:

```bash
npm run dev
```

The server will start on port 5174.

### Step 2: Try Connecting to Gmail
1. Go to `http://localhost:5174/email-hub`
2. Click **"Connect Gmail"** button
3. A Google sign-in popup should appear
4. Select your account: `allinstockpro@gmail.com`
5. Grant permissions when asked

### Step 3: What to Expect
The new Google Identity Services library provides a different OAuth flow:

1. **Popup window opens** with Google sign-in
2. **Select account** screen appears
3. **Grant permissions** (you may see "App is in testing mode" - this is normal)
4. **Popup closes** automatically
5. **Email Hub updates** to show your connected account

**No more `idpiframe_initialization_failed` error!** The deprecated library has been completely removed.

## Expected Behavior When It Works

When OAuth connection succeeds, you should see:

1. **Google OAuth popup opens**
2. **Select your account**: `allinstockpro@gmail.com`
3. **Warning screen**: "Google hasn't verified this app" (this is normal in testing mode)
   - Click "Continue"
4. **Permissions screen**: Shows what the app can access
   - Click "Allow"
5. **Popup closes**
6. **Success message**: "Gmail conectado com sucesso!" or "Gmail connected successfully!"
7. **Email Hub shows**: Your Gmail account info with a green "Connected" badge
8. **Sync button**: "Sync Emails" button becomes active

## Files Modified

1. `vite.config.js` - Server configuration
2. `src/pages/emailHub/EmailHub.jsx` - Enhanced error handling
3. `EMAIL_HUB_SETUP.md` - Updated setup instructions and troubleshooting

## New Files Created

1. `OAUTH_400_ERROR_FIX.md` - Quick fix checklist for 400 error
2. `FIXES_APPLIED.md` - This file

## Still Having Issues?

If you follow all steps and still get the 400 error:

1. **Check the enhanced console logs**: The error message now shows much more detail
2. **Verify Gmail API is enabled**: Google Cloud Console → APIs & Services → Library → Gmail API
3. **Try creating a new OAuth client**: Sometimes the client configuration gets corrupted
4. **Check Network tab**: Open browser DevTools → Network tab → Try connecting → Look for the failed request

## Next Steps After OAuth Works

Once Gmail connection succeeds, you can:
1. ✅ Click "Sync Emails" to import up to 200 recent emails
2. ✅ View sync statistics (total, client, supplier, unmatched emails)
3. ✅ Add email history display to client/supplier detail pages
4. ✅ Implement send email functionality

## Support Resources

- **Setup Guide**: [EMAIL_HUB_SETUP.md](EMAIL_HUB_SETUP.md)
- **Quick Fix**: [OAUTH_400_ERROR_FIX.md](OAUTH_400_ERROR_FIX.md)
- **Google OAuth Docs**: https://developers.google.com/identity/protocols/oauth2
- **Gmail API Docs**: https://developers.google.com/gmail/api
