# Fix OAuth 400 Error - Quick Checklist

## Problem
You're seeing this error when clicking "Connect Gmail":
```
Failed to load resource: accounts.google.com/...rt/fine-allowlist:1
the server responded with a status of 400 ()
Error connecting Gmail
```

## Solution - Follow These Steps IN ORDER

### ✅ Step 1: Save OAuth Scopes (MOST COMMON FIX)

1. Open [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project: **AllInStock Email Integration**
3. Go to: **APIs & Services** → **OAuth consent screen**
4. Click **"EDIT APP"** button (top right)
5. Click **"SAVE AND CONTINUE"** on App information page
6. On **"Scopes"** page:
   - Click **"ADD OR REMOVE SCOPES"** button
   - You should see both scopes checked:
     - ✅ `https://www.googleapis.com/auth/gmail.readonly`
     - ✅ `https://www.googleapis.com/auth/gmail.send`
   - **CRITICAL**: Scroll down and click **"UPDATE"** button at the bottom of the popup
   - After clicking UPDATE, click **"SAVE AND CONTINUE"**
7. Click **"SAVE AND CONTINUE"** on Test users page
8. Click **"BACK TO DASHBOARD"**

### ✅ Step 2: Verify Authorized Origins

1. Still in Google Cloud Console
2. Go to: **APIs & Services** → **Credentials**
3. Click on your OAuth 2.0 Client ID
4. Under **"Authorized JavaScript origins"**, verify you have:
   ```
   http://localhost:5174
   ```
5. Under **"Authorized redirect URIs"**, verify you have:
   ```
   http://localhost:5174/email-hub
   ```
6. If anything is missing or wrong, add/fix it and click **"SAVE"**

### ✅ Step 3: Wait for Propagation

**IMPORTANT**: Google's changes can take **5-10 minutes** to propagate globally.

- Set a timer for 10 minutes
- Don't try to connect during this time
- Get a coffee ☕

### ✅ Step 4: Clear Browser Cache

1. In your browser, press: **Ctrl + Shift + Delete** (Windows) or **Cmd + Shift + Delete** (Mac)
2. Select:
   - ✅ Cookies and other site data
   - ✅ Cached images and files
3. Click **"Clear data"**

### ✅ Step 5: Restart Development Server

1. Go to your terminal/command prompt
2. Press **Ctrl + C** to stop the dev server
3. Run: `npm run dev`
4. Wait for server to start on port 5174

### ✅ Step 6: Try Connecting Again

1. Open browser to: `http://localhost:5174/email-hub`
2. Click **"Connect Gmail"** button
3. You should see Google's OAuth consent screen
4. Select your Gmail account: `allinstockpro@gmail.com`
5. Click **"Continue"** when you see the warning about "unverified app" (this is normal in testing mode)
6. Grant permissions

## Still Not Working?

### Try Incognito Mode
1. Open browser in incognito/private mode
2. Go to: `http://localhost:5174/email-hub`
3. Try connecting

### Check Console for More Details
1. Press **F12** to open browser developer tools
2. Go to **Console** tab
3. Click **"Connect Gmail"**
4. Look for the full error object (expand the error by clicking the arrow)
5. Take a screenshot and check for specific error messages

### Verify Gmail API is Enabled
1. Google Cloud Console → **APIs & Services** → **Library**
2. Search for "Gmail API"
3. Should show **"MANAGE"** button (not "ENABLE")
4. If it shows "ENABLE", click it

## What Happens After It Works?

When OAuth connection succeeds:
1. You'll see a popup asking for permissions
2. After granting permissions, popup closes
3. You'll see your Gmail account info in the Email Hub
4. A green "Connected" badge appears
5. "Sync Emails" button becomes active

## Common Mistakes

❌ **Forgetting to click UPDATE** after selecting scopes
✅ Always click UPDATE, then SAVE AND CONTINUE

❌ **Not waiting for propagation**
✅ Wait 5-10 minutes after saving changes

❌ **Wrong port in authorized origins**
✅ Must be exactly `http://localhost:5174` (no trailing slash)

❌ **Trying with non-test user**
✅ Must use `allinstockpro@gmail.com` (the test user you added)

## Support

If none of these steps work:
1. Check the main documentation: [EMAIL_HUB_SETUP.md](EMAIL_HUB_SETUP.md)
2. Verify all setup steps were completed
3. Check that you're using the test user email
4. Try creating a new OAuth client ID (as last resort)
