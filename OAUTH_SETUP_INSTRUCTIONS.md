# Google OAuth Setup Instructions for AllInStock

## Problem
Error: "Acesso bloqueado: o pedido da app allinstock é inválido"
Error Code: `redirect_uri_mismatch`

This happens because your Google OAuth client is not configured for your production domain.

## Solution

### 1. Access Google Cloud Console

Go to: https://console.cloud.google.com/apis/credentials?project=allinstock-ded6e

### 2. Find Your OAuth 2.0 Client ID

Look for the client with ID: `1018807409883-23boqn5amq8a20mbvq9et7v8b0jq5des.apps.googleusercontent.com`

Click on it to edit.

### 3. Add Authorized Redirect URIs

In the "Authorized redirect URIs" section, add ALL of these:

```
https://allinstock.pt/email-hub
https://allinstock-ded6e.web.app/email-hub
https://allinstock-ded6e.firebaseapp.com/email-hub
https://allinstock.pt/calendar
https://allinstock-ded6e.web.app/calendar
https://allinstock-ded6e.firebaseapp.com/calendar
```

**Important Notes:**
- No trailing slashes
- Must be HTTPS (not HTTP)
- Must match exactly - one character difference will fail

### 4. Add Authorized JavaScript Origins

In the "Authorized JavaScript origins" section, add ALL of these:

```
https://allinstock.pt
https://allinstock-ded6e.web.app
https://allinstock-ded6e.firebaseapp.com
```

### 5. Save Changes

1. Click the **SAVE** button at the bottom
2. Wait 5-10 minutes for changes to propagate across Google's servers

### 6. Test the Integration

After waiting 5-10 minutes:

1. Go to https://allinstock.pt
2. Login to your account
3. Navigate to Email Hub or Calendar
4. Click "Connect Gmail" or "Connect Google Calendar"
5. The OAuth screen should now work without errors

## Troubleshooting

### Still getting errors after 10 minutes?

1. **Clear browser cache**: Ctrl+Shift+Delete → Clear cached images and files
2. **Try incognito/private mode**: To ensure no cached data
3. **Check the redirect URI in the error**: Make sure it matches exactly what you added
4. **Verify the OAuth client**: Make sure you edited the correct client ID

### Need to add localhost for testing?

If you want to test locally as well, also add:

```
http://localhost:5174/email-hub
http://localhost:5174/calendar
http://localhost:5173/email-hub
http://localhost:5173/calendar
```

And for origins:
```
http://localhost:5174
http://localhost:5173
```

## Gmail API Scopes

The app currently uses these scopes:
- `https://www.googleapis.com/auth/gmail.readonly` - Read emails
- `https://www.googleapis.com/auth/gmail.send` - Send emails

## Calendar API Scopes

The app uses:
- `https://www.googleapis.com/auth/calendar` - Full calendar access
- `https://www.googleapis.com/auth/calendar.events` - Calendar events

## Important Security Notes

1. **Never share your OAuth Client Secret** publicly
2. **Keep your service account keys secure**
3. **Only add trusted domains** to authorized origins
4. **Review OAuth consent screen** to ensure proper branding

## Need Help?

If you continue to have issues:

1. Check the exact error message in the browser console (F12)
2. Verify the Client ID in `src/services/gmailIntegration.js` matches the one in Google Cloud Console
3. Ensure Gmail API and Google Calendar API are enabled in your project
4. Check that the OAuth consent screen is properly configured

## Quick Links

- **Google Cloud Console**: https://console.cloud.google.com/apis/credentials?project=allinstock-ded6e
- **Gmail API**: https://console.cloud.google.com/apis/library/gmail.googleapis.com?project=allinstock-ded6e
- **Calendar API**: https://console.cloud.google.com/apis/library/calendar-json.googleapis.com?project=allinstock-ded6e
- **OAuth Consent Screen**: https://console.cloud.google.com/apis/credentials/consent?project=allinstock-ded6e
