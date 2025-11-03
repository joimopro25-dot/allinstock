# How to Set Super Admin Role

## Quick Method: Update via Firebase Console (RECOMMENDED)

Since you're already in the Firebase Console, follow these steps:

### Step 1: Navigate to the Users Collection
1. You're already in Firestore Database (I can see it in your screenshot)
2. Click on the `users` collection in the left sidebar
3. Find the document with your user ID (the one associated with `olijack84@gmail.com`)

### Step 2: Add the Super Admin Role
1. Click on your user document to open it
2. Click "+ Add field" button
3. Enter the following:
   - **Field name**: `role`
   - **Type**: string
   - **Value**: `super_admin`
4. Click "Update" or "Save"

### Step 3: Verify
1. Refresh the page
2. You should now see the `role` field with value `super_admin`

### Step 4: Test Access
1. Go to https://allinstock.pt
2. Login with your account (olijack84@gmail.com)
3. Try to access the Admin Dashboard
4. You should now have full super admin privileges!

---

## Alternative Method: Using Firebase Console UI

If the user document doesn't exist yet, you may need to create it first:

1. In Firestore Database, click on the `users` collection
2. Click "+ Start collection" (if it doesn't exist) or "+ Add document"
3. Set Document ID to your Firebase Auth UID (you can find this in Authentication > Users)
4. Add the following fields:
   ```
   email: "olijack84@gmail.com"
   role: "super_admin"
   createdAt: [current timestamp]
   companyId: "your-company-id" (if applicable)
   ```
5. Click "Save"

---

## What This Does

The `super_admin` role gives you access to:
- Admin Dashboard
- Manage all companies
- Manage all users
- View and edit all plans
- Access payment records
- Full system configuration

---

## Troubleshooting

### Can't see the users collection?
- Make sure you're looking at the correct Firebase project: `allinstock-ded6e`
- The collection might be empty if no users have registered yet
- Go to Authentication tab first to see if your user exists there

### Still can't access Admin Dashboard after setting role?
1. Clear your browser cache and cookies
2. Log out and log back in
3. Check browser console for any errors
4. Verify the role field is exactly `super_admin` (case-sensitive)

---

## Your User Information

Based on your screenshot:
- **Email**: olijack84@gmail.com
- **Company ID**: qeln00f4DTaVodADpckPZwP... (visible in screenshot)
- **Firebase Project**: allinstock-ded6e

---

**Need help?** If you encounter any issues, let me know!
