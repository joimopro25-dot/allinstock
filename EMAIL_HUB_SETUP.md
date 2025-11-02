# Email Hub Setup Guide

## Overview

The Email Hub connects your company's Gmail account to automatically sync emails with clients and suppliers. It matches emails by address and displays the history in each contact's detail page.

## Features

✅ **Gmail OAuth Integration** - Secure connection to Gmail
✅ **Automatic Email Sync** - Import emails with one click
✅ **Smart Matching** - Automatically links emails to clients/suppliers
✅ **Email History** - View all communications in contact profiles
✅ **Send Emails** - Send emails directly from the app (coming soon)

## Google Cloud Setup (Required)

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project name: `AllInStock Email Integration`
4. Click "Create"

### Step 2: Enable Gmail API

1. In your project, go to "APIs & Services" → "Library"
2. Search for "Gmail API"
3. Click "Gmail API" → Click "Enable"

### Step 3: Configure OAuth Consent Screen

1. Go to "APIs & Services" → "OAuth consent screen"
2. Select "External" (for testing) → Click "Create"
3. Fill in the required fields:
   - **App name**: AllInStock
   - **User support email**: Your email
   - **Developer contact**: Your email
4. Click "Save and Continue"
5. On "Scopes" page, click "Add or Remove Scopes"
6. Add these scopes:
   - `https://www.googleapis.com/auth/gmail.readonly` (Read emails)
   - `https://www.googleapis.com/auth/gmail.send` (Send emails)
7. **IMPORTANT**: Click "UPDATE" button at the bottom of the scopes popup
8. Click "Save and Continue" on the main OAuth consent screen
9. On "Test users", click "Add Users"
10. Add your Gmail address → Click "Save and Continue"
11. Click "Back to Dashboard"

### Step 4: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Select "Web application"
4. Name: `AllInStock Web Client`
5. Under "Authorized JavaScript origins", add:
   ```
   http://localhost:5174
   http://localhost:5173
   ```
6. Under "Authorized redirect URIs", add:
   ```
   http://localhost:5174/email-hub
   http://localhost:5173/email-hub
   ```
7. Click "Create"
8. **Copy the Client ID and Client Secret** (you'll need these)

### Step 5: Update Your Code

Open `src/services/gmailIntegration.js` and update the GMAIL_CONFIG:

```javascript
const GMAIL_CONFIG = {
  clientId: 'YOUR_CLIENT_ID_HERE.apps.googleusercontent.com',  // Paste your Client ID
  apiKey: 'YOUR_API_KEY_HERE',  // Create API key in Google Cloud Console
  discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest'],
  scopes: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send'
};
```

### Step 6: Create API Key (Optional but Recommended)

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "API Key"
3. Copy the API key
4. Click "Restrict Key"
5. Under "Application restrictions", select "HTTP referrers"
6. Add: `localhost:*`
7. Under "API restrictions", select "Restrict key"
8. Select "Gmail API"
9. Click "Save"
10. Paste the API key in `gmailIntegration.js`

## How to Use

### 1. Connect Gmail Account

1. Navigate to **Email Hub** in the sidebar
2. Click **"Connect Gmail"** button
3. Sign in with your Gmail account
4. Grant permissions to read and send emails
5. You'll see your email connected

### 2. Sync Emails

1. Click **"Sync Emails"** button
2. The system will:
   - Fetch up to 200 recent emails
   - Match sender/recipients to your clients and suppliers
   - Save them to Firestore
3. Watch the progress bar
4. See statistics when sync completes

### 3. View Email History

1. Go to **Clients** or **Suppliers**
2. Click on any contact
3. Navigate to the **"Emails"** tab (coming in next update)
4. See all email communications with that contact

## Email Matching Logic

Emails are automatically matched to contacts using this logic:

1. **Extract email addresses** from `From`, `To`, and `Cc` fields
2. **Compare with database**: Check if email exists in clients or suppliers
3. **Assign contact**:
   - If sender matches a contact → Assign to that contact
   - If recipient matches → Assign to that contact
   - If no match → Mark as "Unmatched"

4. **Store in Firestore** with:
   ```javascript
   {
     messageId: 'gmail-message-id',
     subject: 'Email subject',
     from: 'sender@example.com',
     to: ['recipient@example.com'],
     date: '2025-01-15T10:30:00Z',
     body: 'Email content...',
     contactId: 'client-or-supplier-id',
     contactName: 'John Doe',
     contactType: 'client' or 'supplier',
     syncedAt: '2025-01-15T10:35:00Z'
   }
   ```

## Firestore Structure

```
companies/{companyId}/
  ├─ emailConfig/{configId}
  │   ├─ provider: 'gmail'
  │   ├─ email: 'company@gmail.com'
  │   └─ connectedAt: timestamp
  │
  └─ emails/{emailId}
      ├─ messageId: 'unique-gmail-id'
      ├─ threadId: 'gmail-thread-id'
      ├─ subject: string
      ├─ from: string
      ├─ to: string[]
      ├─ cc: string[]
      ├─ date: timestamp
      ├─ body: string
      ├─ snippet: string
      ├─ contactId: string (optional)
      ├─ contactName: string (optional)
      ├─ contactType: 'client' | 'supplier' (optional)
      ├─ hasAttachments: boolean
      └─ syncedAt: timestamp
```

## Security & Privacy

✅ **OAuth 2.0** - Industry standard authentication
✅ **Read-only by default** - Only reads your emails
✅ **User consent** - You explicitly grant permissions
✅ **Firestore security** - Only authenticated users access data
✅ **No password storage** - Uses secure token system

## Limitations

- **Sync limit**: 200 emails per sync (to avoid rate limits)
- **Gmail only**: Currently supports Gmail, Outlook coming soon
- **Test mode**: OAuth app starts in test mode (max 100 users)
- **Rate limits**: Google API has daily quotas

## Troubleshooting

### Error: 400 (Bad Request) from accounts.google.com
**This is the most common error during initial setup**

**Symptoms**:
- Console shows: `Failed to load resource: accounts.google.com/...rt/fine-allowlist:1 the server responded with a status of 400 ()`
- Error appears when clicking "Connect Gmail"

**Solution**:
1. **Verify OAuth scopes are SAVED**:
   - Go to Google Cloud Console → APIs & Services → OAuth consent screen
   - Click "EDIT APP"
   - Go to "Scopes" step
   - Click "ADD OR REMOVE SCOPES"
   - Make sure both scopes are checked:
     - ✅ `https://www.googleapis.com/auth/gmail.readonly`
     - ✅ `https://www.googleapis.com/auth/gmail.send`
   - **CRITICAL**: Click "UPDATE" button at bottom of scopes popup
   - Click "SAVE AND CONTINUE" on the main screen

2. **Wait for propagation**: Changes can take 5-10 minutes to propagate in Google's systems

3. **Clear browser cache**:
   - Press `Ctrl+Shift+Delete` (Windows) or `Cmd+Shift+Delete` (Mac)
   - Clear "Cached images and files"
   - Clear "Cookies and other site data"

4. **Try incognito/private mode**: Open the app in a private browsing window

5. **Verify authorized origins match exactly**:
   - Go to Credentials → Your OAuth Client
   - Authorized JavaScript origins should include: `http://localhost:5174`
   - Authorized redirect URIs should include: `http://localhost:5174/email-hub`

6. **Restart dev server**: Stop and restart `npm run dev`

### Error: "Not authorized. Please sign in first"
**Solution**: Click "Connect Gmail" to authorize the app

### Error: "Failed to load emails"
**Solution**:
1. Check that Gmail API is enabled
2. Verify OAuth credentials are correct
3. Make sure test user email is added in OAuth consent screen

### No emails syncing
**Solution**:
1. Ensure you have emails in your Gmail account
2. Check console for errors
3. Verify Firestore rules allow email collection access

### Emails not matching contacts
**Solution**:
1. Verify client/supplier email addresses are correctly entered
2. Email matching is case-insensitive
3. Check that emails use exact same address format

## Production Deployment

When ready for production:

1. **Publishing OAuth App**:
   - Go to OAuth consent screen
   - Click "Publish App"
   - Submit for verification (if needed)

2. **Update Authorized Origins**:
   - Add your production domain
   - Example: `https://allinstock.com`

3. **Update Redirect URIs**:
   - Add production callback
   - Example: `https://allinstock.com/email-hub`

4. **API Quotas**:
   - Monitor usage in Google Cloud Console
   - Request quota increase if needed

## Next Steps

- [ ] Complete Google Cloud setup
- [ ] Update OAuth credentials in code
- [ ] Test Gmail connection
- [ ] Sync sample emails
- [ ] Verify email matching works
- [ ] Add email display to client/supplier detail pages
- [ ] Implement send email functionality

## Support

For issues:
1. Check console logs for errors
2. Verify all setup steps completed
3. Ensure Firebase rules are deployed
4. Check Google Cloud Console for API errors

## Future Enhancements

🔜 **Outlook Integration** - Support for Microsoft 365
🔜 **Send Emails** - Compose and send from app
🔜 **Email Templates** - Pre-defined email templates
🔜 **Attachments** - Download and view attachments
🔜 **Email Search** - Full-text search across emails
🔜 **Filters** - Filter by date, sender, etc.
🔜 **Auto-sync** - Background email syncing
