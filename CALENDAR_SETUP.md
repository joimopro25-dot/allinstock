# Google Calendar Integration - Setup Guide

## Overview

The AllInStock CRM now includes a powerful Google Calendar integration that automatically syncs all your CRM events (deliveries, payments, alerts) to Google Calendar!

## Features

### 1. Google Calendar Connection
- **Persistent connection** - stays connected across sessions
- **OAuth 2.0 authentication** using Google Identity Services
- **Secure token storage** in Firestore

### 2. CRM Event Synchronization
Automatically creates calendar events from:
- 📦 **Deliveries** - from Purchase Orders with expected delivery dates
- 💰 **Payment Due Dates** - from pending Invoices
- ⚠️ **Low Stock Alerts** - daily alerts for products below minimum stock

### 3. Event Management
- ✅ View events in beautiful month calendar view
- ✅ Create custom events with title, date, time, location, attendees
- ✅ Edit and delete events
- ✅ Click events to see full details
- ✅ View events in Google Calendar (external link)

### 4. Two-Way Sync
- Events created in CRM → sync to Google Calendar
- Events from Google Calendar → appear in CRM calendar view

## Setup Instructions

### Step 1: Enable Google Calendar API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project: **`allinstock`** (the same project you used for Gmail)
3. Click **"APIs & Services"** → **"Library"**
4. Search for **"Google Calendar API"**
5. Click **"Google Calendar API"**
6. Click **"ENABLE"**

### Step 2: Add Calendar Scope to OAuth Consent Screen

1. In Google Cloud Console, go to **"APIs & Services"** → **"OAuth consent screen"**
2. Scroll down to **"Scopes for Google APIs"**
3. Click **"ADD OR REMOVE SCOPES"**
4. Search for **"Google Calendar API"**
5. Select these scopes:
   - `https://www.googleapis.com/auth/calendar` (View and manage your calendars)
   - `https://www.googleapis.com/auth/calendar.events` (View and edit events)
6. Click **"UPDATE"**
7. Click **"SAVE AND CONTINUE"**

### Step 3: Add Test User (if in Testing mode)

If your OAuth consent screen is in **"Testing"** mode:
1. Go to **"OAuth consent screen"**
2. Scroll to **"Test users"**
3. Click **"+ ADD USERS"**
4. Add your email: `allinstockpro@gmail.com`
5. Click **"SAVE"**

### Step 4: Deploy Firestore Rules and Indexes

Run these commands to deploy the updated security rules and indexes:

```bash
# Deploy Firestore security rules
firebase deploy --only firestore:rules

# Deploy Firestore indexes
firebase deploy --only firestore:indexes
```

Wait 2-10 minutes for indexes to build. Monitor progress at:
https://console.firebase.google.com/project/allinstock-ddb69/firestore/indexes

### Step 5: Test the Integration

1. Start your dev server:
   ```bash
   npm run dev
   ```

2. Navigate to **Calendar** in the sidebar

3. Click **"Connect Google Calendar"**

4. Sign in with your Google account: `allinstockpro@gmail.com`

5. Grant permissions when prompted

6. You should see: **"Connected to: allinstockpro@gmail.com"**

## How to Use

### Connect Google Calendar

1. Open the app at `http://localhost:5174`
2. Click **"Calendar"** in the sidebar
3. Click **"Connect Google Calendar"** button
4. Sign in and grant permissions
5. Connection is saved - you won't need to reconnect!

### Sync CRM Events

1. Go to **Calendar** page
2. Click **"Sync CRM"** button
3. The system will:
   - Find all pending purchase orders with delivery dates
   - Find all pending invoices with due dates
   - Find all low stock products
   - Create calendar events for each
   - Push events to Google Calendar

4. Events appear in both:
   - Your CRM calendar view (with color coding)
   - Google Calendar (accessible from any device)

### Create Custom Event

1. Click **"New Event"** button
2. Fill in:
   - **Title** - Event name
   - **Start** - Date and time
   - **End** - Date and time
   - **Location** - Optional
   - **Description** - Optional
   - **Attendees** - Comma-separated emails
3. Click **"Create Event"**
4. Event appears in calendar and Google Calendar

### View Event Details

1. Click on any event in the calendar
2. See full details:
   - Start and end times
   - Location
   - Description
   - Event type (delivery, payment, alert, custom)
3. Click **"View in Google Calendar"** to open in Google

### Delete Event

1. Click on a custom event
2. Click **"Delete"** button
3. Event is removed from both CRM and Google Calendar

**Note**: CRM-generated events (deliveries, payments, alerts) cannot be deleted manually - they're automatically created from your CRM data.

## Event Types and Colors

The calendar uses color coding for different event types:

- 📦 **Delivery** - Green (#10b981)
  - Source: Purchase Orders with expected delivery date
  - Example: "📦 Delivery: Supplier Name"

- 💰 **Payment** - Orange (#f59e0b)
  - Source: Pending Invoices with due date
  - Example: "💰 Payment Due: Client Name"

- ⚠️ **Alert** - Red (#ef4444)
  - Source: Low stock products
  - Example: "⚠️ Low Stock Alert: 5 products"

- 📅 **Custom** - Blue (#3b82f6)
  - Created manually by users
  - Any title you choose

## Calendar Views

### Month View (Default)
- See entire month at a glance
- Each day shows up to 3 events
- Click "+X more" to see all events for a day
- **Today** is highlighted in blue
- Navigate with ← → arrows or "Today" button

### Week View (Coming Soon)
- See 7 days in detail
- Hour-by-hour timeline
- Drag and drop to reschedule

### Day View (Coming Soon)
- See single day schedule
- Detailed time slots
- Perfect for busy days

## Data Structure

### Firestore Collections

```
companies/{companyId}/
  ├─ calendarConfig/{configId}
  │   ├─ provider: 'google'
  │   ├─ email: 'user@gmail.com'
  │   ├─ accessToken: '...'
  │   └─ connectedAt: timestamp
  │
  └─ calendarEvents/{eventId}
      ├─ googleEventId: string
      ├─ summary: string
      ├─ description: string
      ├─ start: timestamp
      ├─ end: timestamp
      ├─ location: string
      ├─ attendees: string[]
      ├─ type: 'delivery' | 'payment' | 'alert' | 'custom'
      ├─ sourceId: string (PO/Invoice ID)
      ├─ sourceType: 'purchaseOrder' | 'invoice' | 'stock'
      ├─ color: string
      └─ syncedAt: timestamp
```

## How CRM Events Are Generated

### Delivery Events
```javascript
// From Purchase Orders
- Status: 'pending'
- Has: expectedDeliveryDate
→ Creates: 1-hour event on delivery date
→ Title: "📦 Delivery: {supplierName}"
→ Description: PO number, supplier, total
```

### Payment Events
```javascript
// From Invoices
- Status: 'pending'
- Has: dueDate
→ Creates: All-day event on due date
→ Title: "💰 Payment Due: {clientName}"
→ Description: Invoice number, client, amount
```

### Stock Alerts
```javascript
// From Stock
- quantity <= minStock
→ Creates: Daily reminder at 9 AM
→ Title: "⚠️ Low Stock Alert: {count} products"
→ Description: List of low stock products
```

## Sync Strategy

### One-Way Sync (CRM → Google)
When you click "Sync CRM":
1. Generate events from CRM data
2. Check if event already exists (by sourceId)
3. If exists: Update in Google Calendar
4. If new: Create in Google Calendar
5. Save googleEventId to Firestore

### Google → CRM
When page loads or month changes:
1. Fetch events from Google Calendar for current month
2. Display alongside CRM events
3. Distinguish by type (CRM events have `type` field)

## Troubleshooting

### Connection Issues

**Problem**: Can't connect to Google Calendar
**Solutions**:
1. Check that Google Calendar API is enabled
2. Verify calendar scopes are added to OAuth consent screen
3. Clear browser cache and try again
4. Check browser console for errors

### Events Not Syncing

**Problem**: "Sync CRM" doesn't create events
**Solutions**:
1. Make sure you're connected (see email at top)
2. Check that you have:
   - Pending Purchase Orders with delivery dates
   - Pending Invoices with due dates
   - Products with low stock
3. Check browser console for errors
4. Verify Firestore indexes are built (not in "Building" status)

### Missing Events

**Problem**: Events don't appear in calendar
**Solutions**:
1. Check the date range - events only show for current month
2. Navigate to the month containing the event
3. Check event start date in Firestore
4. Verify event has valid start/end dates

### Permission Errors

**Problem**: "Not authorized" when syncing
**Solutions**:
1. Disconnect and reconnect Google Calendar
2. Check that test user is added (if in Testing mode)
3. Verify scopes are correct
4. Token may have expired - reconnect

## Security & Privacy

✅ **Access token stored securely** in Firestore (company-specific)
✅ **Token automatically revoked** on disconnect
✅ **OAuth 2.0 standard** authentication
✅ **Read and write permissions** for Calendar API
✅ **Company-isolated** data (each company has separate config)

## API Quotas

Google Calendar API has daily quotas:
- **Queries per day**: 1,000,000 (more than enough)
- **Queries per 100 seconds**: 10,000

For typical usage (100 employees, 1000 events/month):
- Connecting: 1 query
- Syncing CRM events: ~100 queries
- Loading calendar: 1 query per month view
- Creating event: 1 query

**You'll never hit the quota** with normal usage!

## Best Practices

1. **Sync regularly**: Click "Sync CRM" daily or weekly to keep events up-to-date

2. **Set accurate dates**:
   - Add expected delivery dates to Purchase Orders
   - Set realistic due dates on Invoices
   - Configure minimum stock levels for alerts

3. **Use custom events** for:
   - Client meetings
   - Team meetings
   - Deadlines
   - Reminders

4. **Check Google Calendar**: Events sync to your actual Google Calendar, accessible from:
   - Gmail
   - Google Calendar app (mobile)
   - Google Calendar website
   - Any calendar app syncing with Google

5. **Don't delete CRM events**: They're auto-generated from your data
   - Update the source (PO, Invoice) instead
   - Re-sync to update calendar

## Future Enhancements

Planned features for future updates:
- 📅 Week and Day views
- 🔔 Push notifications for upcoming events
- 📧 Email reminders
- 🎨 Custom color coding
- 📱 Mobile app integration (via Capacitor)
- 🔄 Automatic background sync
- 📎 Attach files to events
- 👥 Share calendars with team members
- 🔁 Recurring events support

## Files Created

### Services
1. **[calendarIntegration.js](src/services/calendarIntegration.js)** - Google Calendar API integration
2. **[calendarService.js](src/services/calendarService.js)** - Firestore operations and CRM event generation

### Components
3. **[Calendar.jsx](src/pages/calendar/Calendar.jsx)** - Calendar page component
4. **[Calendar.css](src/pages/calendar/Calendar.css)** - Calendar styling

### Configuration
5. **[App.jsx](src/App.jsx)** - Added /calendar route
6. **[Sidebar.jsx](src/components/common/Sidebar.jsx)** - Added Calendar menu item
7. **[firestore.rules](firestore.rules)** - Added calendarConfig and calendarEvents security rules
8. **[firestore.indexes.json](firestore.indexes.json)** - Added calendarEvents index

## Summary

You now have a complete Calendar system that:

✅ Connects to Google Calendar with OAuth 2.0
✅ Syncs deliveries, payments, and alerts automatically
✅ Creates custom events with attendees
✅ Beautiful month calendar view
✅ Two-way sync with Google Calendar
✅ Persistent connection
✅ Color-coded event types
✅ Secure Firestore storage

**Next steps**:
1. Enable Google Calendar API in Google Cloud Console
2. Add calendar scopes to OAuth consent screen
3. Deploy Firestore rules and indexes
4. Connect your calendar in the app
5. Click "Sync CRM" to create events!

Enjoy your new integrated calendar system! 🎉
