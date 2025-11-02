# AllInStock SaaS Platform - Setup Guide

## 🎉 Congratulations! Your SaaS Platform is Ready

You now have a complete multi-tenant SaaS platform with:
- ✅ Landing page with pricing
- ✅ Registration with plan selection & promo codes
- ✅ Super admin dashboard
- ✅ Promo code management
- ✅ Secure multi-tenant architecture

---

## 📋 Table of Contents
1. [Creating Your First Super Admin](#1-creating-your-first-super-admin)
2. [Accessing the Admin Panel](#2-accessing-the-admin-panel)
3. [Creating Promo Codes](#3-creating-promo-codes)
4. [Testing the Complete Flow](#4-testing-the-complete-flow)
5. [Managing Companies](#5-managing-companies)
6. [Next Steps](#6-next-steps)

---

## 1. Creating Your First Super Admin

### Method A: Using Firebase Console (Recommended)

1. **Go to Firebase Console**
   - Open: https://console.firebase.google.com/
   - Select your project: `allinstock-ddb69`

2. **Navigate to Firestore Database**
   - Click on "Firestore Database" in the left sidebar
   - Click on "users" collection

3. **Find Your User Document**
   - Look for your user ID (the one you use to login)
   - Click on your user document

4. **Add Super Admin Role**
   - Click "Add field" or edit the document
   - Add a field:
     - **Field name**: `role`
     - **Type**: string
     - **Value**: `super_admin`
   - Click "Update" or "Save"

5. **Verify**
   - Refresh your app
   - Navigate to: `http://localhost:5174/admin`
   - You should now see the Super Admin Dashboard!

### Method B: Using Code (Alternative)

If you prefer to do this programmatically:

```javascript
// In Firebase Console > Firestore > Run a query or use code
import { doc, updateDoc } from 'firebase/firestore';
import { db } from './config/firebase';

// Replace 'YOUR_USER_ID' with your actual user ID
const userRef = doc(db, 'users', 'YOUR_USER_ID');
await updateDoc(userRef, {
  role: 'super_admin'
});
```

---

## 2. Accessing the Admin Panel

Once you've set your role to `super_admin`:

1. **Login** to your account
2. **Navigate** to: `http://localhost:5174/admin`
3. **You'll see** 3 tabs:
   - **Overview**: Analytics and recent companies
   - **Companies**: Full list of all registered companies
   - **Promo Codes**: Manage promotional codes

---

## 3. Creating Promo Codes

### Step-by-Step Guide

1. **Go to Admin Panel**: `http://localhost:5174/admin`
2. **Click on "Promo Codes" tab**
3. **Click "Create Promo Code" button**
4. **Fill in the form**:

#### Example 1: Percentage Discount
```
Code: SUMMER2025
Type: Percentage Discount
Percentage: 20
Duration: Once
Max Uses: 100
Expires At: 2025-12-31
Description: Summer promotion - 20% off first month
```

#### Example 2: Fixed Amount Discount
```
Code: WELCOME10
Type: Fixed Amount
Amount: 10
Duration: Once
Max Uses: (leave empty for unlimited)
Expires At: (leave empty for no expiration)
Description: Welcome offer - €10 off
```

#### Example 3: Free Trial
```
Code: TRIAL30
Type: Free Trial Days
Days: 30
Duration: Once
Max Uses: 50
Expires At: 2025-06-30
Description: 30 days free trial
```

5. **Click "Create Promo Code"**
6. **Your promo code is now active!**

### Testing Promo Codes

1. Logout from admin account
2. Go to: `http://localhost:5174/register`
3. Fill in registration form
4. Click "I have a promo code"
5. Enter your promo code (e.g., `SUMMER2025`)
6. Watch it validate in real-time!
7. See the discount applied in the price summary

---

## 4. Testing the Complete Flow

### Test Scenario 1: Free Plan Registration

1. Navigate to: `http://localhost:5174`
2. Click "Start Free Trial" or "View Pricing"
3. On pricing section, click "Start Free" on Free plan
4. Fill in registration form
5. Complete registration
6. Verify you land on dashboard with Free plan

### Test Scenario 2: Paid Plan with Promo Code

1. Navigate to landing page
2. Click "Get Started" on Professional plan (€15/mo)
3. Fill in registration form
4. Click "I have a promo code"
5. Enter `SUMMER2025` (or your created promo code)
6. See price change from €15 to €12 (with 20% discount)
7. Complete registration

### Test Scenario 3: Admin Managing Everything

1. Login as super admin
2. Go to `/admin`
3. **Overview Tab**: See total companies, revenue, etc.
4. **Companies Tab**: See all registered companies
5. **Promo Codes Tab**:
   - Create new promo code
   - Edit existing promo code
   - Toggle promo code active/inactive
   - Delete promo code
   - View usage statistics

---

## 5. Managing Companies

### View All Companies

In the Admin Panel > Companies Tab, you'll see:
- Company Name
- Owner Email
- Plan (Free, Starter, Professional, Enterprise)
- Status (Active, Canceled, Expired)
- Created Date
- Monthly Revenue

### Company Details

Click on any company to see:
- Full company information
- Subscription details
- User count
- Total revenue contribution

---

## 6. Next Steps

### Immediate Next Steps

1. **✅ Deploy Firestore Rules** (Already done!)
   ```bash
   firebase deploy --only firestore:rules
   ```

2. **🎨 Customize Your Branding**
   - Update logo in [LandingPage.jsx](src/pages/landing/LandingPage.jsx)
   - Change colors in CSS files
   - Update company name in navigation

3. **📧 Set Up Email Notifications**
   - Welcome emails for new registrations
   - Invoice emails
   - Promo code emails

### Advanced Features (Future)

4. **💳 Stripe Integration** (Payment Processing)
   - Add Stripe checkout
   - Automate subscription billing
   - Handle payment webhooks

5. **📊 Usage Limits Enforcement**
   - Block actions when limits reached
   - Show upgrade prompts
   - Usage tracking per company

6. **📈 Advanced Analytics**
   - Revenue charts
   - Churn analysis
   - Cohort analysis
   - MRR tracking

---

## 🔐 Security Checklist

- ✅ Firestore rules enforce company isolation
- ✅ Super admin role required for admin access
- ✅ Promo codes can only be created by super admin
- ✅ Each company can only see their own data
- ✅ Authentication required for all protected routes

---

## 🎯 Key URLs

| Page | URL | Access |
|------|-----|--------|
| Landing Page | `http://localhost:5174/` | Public |
| Register | `http://localhost:5174/register` | Public |
| Login | `http://localhost:5174/login` | Public |
| Dashboard | `http://localhost:5174/dashboard` | Authenticated |
| Admin Panel | `http://localhost:5174/admin` | Super Admin Only |

---

## 📁 File Structure

### SaaS-Specific Files Created

```
src/
├── config/
│   └── plans.js                        # Pricing plans configuration
├── pages/
│   ├── landing/
│   │   ├── LandingPage.jsx            # Main landing page
│   │   └── LandingPage.css            # Landing page styles
│   ├── auth/
│   │   ├── RegisterNew.jsx            # Enhanced registration
│   │   └── Register.css               # Registration styles
│   └── admin/
│       ├── AdminDashboard.jsx         # Super admin dashboard
│       └── AdminDashboard.css         # Admin styles
└── App.jsx                             # Updated with new routes

firestore.rules                         # Security rules with super admin
```

---

## 🆘 Troubleshooting

### Issue: Can't access /admin page

**Solution**: Make sure your user has `role: 'super_admin'` in Firestore users collection.

### Issue: Promo codes not validating

**Solution**:
1. Check Firestore rules are deployed
2. Verify promo code is marked as `active: true`
3. Check expiration date hasn't passed
4. Verify max uses hasn't been reached

### Issue: Companies not showing in admin panel

**Solution**:
1. Make sure you're logged in as super admin
2. Check browser console for errors
3. Verify Firestore rules allow super admin to read all companies

### Issue: Registration fails with promo code

**Solution**:
1. Check if promo code exists in Firestore
2. Verify code is typed correctly (case-sensitive)
3. Check expiration date and max uses

---

## 📊 Pricing Plans Summary

| Plan | Price | Users | Products | Locations |
|------|-------|-------|----------|-----------|
| **Free** | €0/mo | 1 | 50 | 5 |
| **Starter** | €10/mo | 3 | 500 | 20 |
| **Professional** | €15/mo | 10 | 2000 | Unlimited |
| **Enterprise** | €25/mo | Unlimited | Unlimited | Unlimited |

---

## 🎓 How to Create More Promo Codes

### Common Promo Code Patterns

**Holiday Promotions**:
- `BLACKFRIDAY` - 50% off (percentage)
- `NEWYEAR2025` - €5 off (fixed amount)

**Referral Codes**:
- `FRIEND20` - 20% off for referrals
- `PARTNER50` - 50% off for partners

**Trial Extensions**:
- `EXTENDED60` - 60 days free trial
- `TRIAL90` - 90 days free trial

**Limited Time**:
- `FLASH24H` - 24-hour flash sale with max uses
- `EARLY100` - First 100 customers only

---

## ✨ Feature Highlights

### Multi-Tenancy
- Each company has completely isolated data
- No company can see another company's data
- Super admin can see all companies for management

### Promo Code System
- Real-time validation during registration
- Three types: Percentage, Fixed Amount, Free Trial
- Usage limits and expiration dates
- Active/Inactive toggle
- Usage tracking

### Admin Dashboard
- Overview with key metrics
- Company management
- Promo code CRUD operations
- Revenue tracking
- Beautiful, modern UI

---

## 🚀 Production Deployment Checklist

When you're ready to deploy:

- [ ] Update Firebase security rules in production
- [ ] Change all URLs from localhost to your domain
- [ ] Set up custom domain
- [ ] Configure email service for notifications
- [ ] Set up Stripe for payments (if using)
- [ ] Test all flows end-to-end
- [ ] Set up monitoring and error tracking
- [ ] Configure backup strategy
- [ ] Set up SSL certificate
- [ ] Create terms of service and privacy policy

---

## 📞 Support

For issues or questions:
1. Check this guide first
2. Review the code comments
3. Check Firebase Console for errors
4. Review browser console for errors

---

**Your SaaS platform is ready to launch! 🎉**

Start by creating your first super admin user and testing the complete flow!
