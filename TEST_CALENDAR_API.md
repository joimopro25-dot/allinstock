# Test Calendar API Access

## Quick Test

Open this URL in your browser (replace with your API key):

```
https://www.googleapis.com/calendar/v3/users/me/calendarList?key=AIzaSyCvRbrInA84zwRNKm0mqXu0w2OMVH-rT3U
```

**Expected Results**:

### If Calendar API is NOT enabled:
```json
{
  "error": {
    "code": 403,
    "message": "Google Calendar API has not been used in project XXXXX before or it is disabled.",
    "status": "PERMISSION_DENIED"
  }
}
```
**Solution**: Enable the Calendar API in Google Cloud Console

### If API Key is restricted:
```json
{
  "error": {
    "code": 403,
    "message": "Requests to this API calendar method are blocked.",
    "status": "PERMISSION_DENIED"
  }
}
```
**Solution**: Remove API key restrictions or add Calendar API to allowed list

### If everything is working:
```json
{
  "error": {
    "code": 401,
    "message": "Request is missing required authentication credential."
  }
}
```
**This is actually GOOD!** It means the API is enabled and accepting requests. The 401 is expected because we're not authenticated (we need OAuth token, not just API key).

## Step-by-Step Fix

### Option 1: Remove API Key Restrictions (Easiest)

1. Go to [Google Cloud Console - Credentials](https://console.cloud.google.com/apis/credentials)
2. Click on your API key
3. Under "API restrictions", select **"Don't restrict key"**
4. Click **"SAVE"**
5. Wait 1-2 minutes for changes to propagate
6. Refresh your app and try again

### Option 2: Add Calendar API to Restricted Key

1. Go to [Google Cloud Console - Credentials](https://console.cloud.google.com/apis/credentials)
2. Click on your API key
3. Under "API restrictions", select **"Restrict key"**
4. In the dropdown, find and check:
   - ✅ Gmail API (already there)
   - ✅ **Google Calendar API** (add this)
5. Click **"SAVE"**
6. Wait 1-2 minutes for changes to propagate
7. Refresh your app and try again

### Option 3: Create New Unrestricted API Key

1. Go to [Google Cloud Console - Credentials](https://console.cloud.google.com/apis/credentials)
2. Click **"+ CREATE CREDENTIALS"** → **"API key"**
3. Copy the new API key
4. Click **"RESTRICT KEY"** (to add application restrictions only, not API restrictions)
5. Under "Application restrictions", select **"HTTP referrers"**
6. Add these referrers:
   - `http://localhost:5174/*`
   - `https://yourdomain.com/*` (when deployed)
7. Under "API restrictions", select **"Don't restrict key"**
8. Click **"SAVE"**
9. Update both files with the new key:
   - `src/services/gmailIntegration.js`
   - `src/services/calendarIntegration.js`

## Verify API is Enabled

1. Go to [Google Cloud Console - Enabled APIs](https://console.cloud.google.com/apis/dashboard)
2. You should see both:
   - ✅ Gmail API
   - ✅ Google Calendar API (if not visible, it's not enabled!)

## Common Issues

### Issue: "API has not been used in project before"
**Solution**: Enable the Google Calendar API in the API Library

### Issue: "Requests are blocked"
**Solution**: Remove API key restrictions or add Calendar API to allowed list

### Issue: Changes not taking effect
**Solution**:
- Wait 1-2 minutes after saving
- Clear browser cache (Ctrl+Shift+R)
- Restart dev server

## After Fixing

Once you've fixed the API key issue:

1. Refresh the browser
2. Go to Calendar page
3. Click "Connect Google Calendar"
4. You should see the OAuth popup
5. Sign in and grant permissions
6. Calendar should connect successfully!

## Need Help?

If still having issues:
1. Share the response from the test URL above
2. Share a screenshot of your API key settings (hide the key value)
3. Verify the Calendar API shows as "enabled" in the dashboard
