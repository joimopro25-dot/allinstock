# Eupago Payment Integration Guide

This document describes the complete payment integration for AllInStock CRM using Eupago (MB WAY and Multibanco).

## Architecture Overview

### Components

1. **Admin Panel** ([AdminDashboardNew.jsx](src/pages/admin/AdminDashboardNew.jsx))
   - Manage pricing plans in Firestore
   - View payments and subscriptions
   - Configure payment settings (Eupago API key)

2. **Landing Page** ([LandingPage.jsx](src/pages/landing/LandingPage.jsx))
   - Displays pricing plans fetched from Firestore
   - Dynamically updates when admin changes plans
   - Shows promo code discounts

3. **Registration Page** ([RegisterNew.jsx](src/pages/auth/RegisterNew.jsx))
   - Multi-step registration process
   - Payment method selection (MB WAY / Multibanco)
   - Promo code validation
   - Payment confirmation

4. **Cloud Functions** ([functions/index.js](functions/index.js))
   - `createMbWayPayment` - Creates MB WAY payment
   - `createMultibancoPayment` - Generates Multibanco reference
   - `eupagoWebhook` - Processes payment notifications

5. **Payment Service** ([eupagoService.js](src/services/eupagoService.js))
   - Frontend service for calling cloud functions
   - Promo code validation
   - Helper functions for formatting

## Setup Instructions

### 1. Configure Eupago API

1. Sign up for Eupago account at https://eupago.pt/
2. Get your API key from the dashboard
3. Generate a webhook secret

### 2. Set Firebase Environment Variables

```bash
# Set Eupago credentials in Firebase
firebase functions:config:set eupago.api_key="YOUR_EUPAGO_API_KEY"
firebase functions:config:set eupago.webhook_secret="YOUR_WEBHOOK_SECRET"
```

### 3. Deploy Cloud Functions

```bash
# From project root
firebase deploy --only functions
```

### 4. Configure Webhook in Eupago Dashboard

Set your webhook URL in Eupago dashboard:
```
https://YOUR_PROJECT.cloudfunctions.net/eupagoWebhook
```

### 5. Configure Admin Panel

1. Login as super admin
2. Go to Admin Dashboard → Settings → Payment
3. Enter your Eupago API key
4. Enable Eupago payments

## Registration Flow

### For Free Plan
1. User fills registration form
2. Selects "Free" plan
3. Creates account
4. Redirected to dashboard immediately

### For Paid Plans
1. User fills registration form
2. Selects paid plan (Starter, Professional, Enterprise)
3. Optionally enters promo code
4. Creates account
5. Redirected to payment method selection
6. Chooses MB WAY or Multibanco:

#### MB WAY Flow
1. User enters phone number
2. Click "Pay"
3. Payment request sent to phone
4. User confirms in MB WAY app
5. Webhook receives confirmation
6. Subscription activated
7. User can access dashboard

#### Multibanco Flow
1. User clicks "Multibanco"
2. System generates entity and reference
3. User sees payment details
4. User pays at ATM or home banking
5. Webhook receives confirmation
6. Subscription activated
7. User can access dashboard

## Promo Code System

### Admin Creates Promo Code
```javascript
// In Firestore /promoCodes collection
{
  code: "PROMO2025",
  type: "percentage", // or "fixed_amount"
  value: 20, // 20% or €20
  active: true,
  validFrom: Timestamp,
  validUntil: Timestamp,
  maxUses: 100,
  currentUses: 0,
  description: "20% off for new users"
}
```

### User Applies Promo Code
1. User enters code during registration
2. Frontend validates code against Firestore
3. Shows discount in price summary
4. Discount applied when creating payment
5. Cloud function recalculates final amount

## Payment Webhook Flow

```
Eupago Payment → Webhook → Verify Signature → Update Payment
                              ↓
                         Payment Succeeded?
                              ↓
                         Activate Subscription
                              ↓
                         Create/Update Company
                              ↓
                         Link User to Company
```

## Firestore Collections

### /plans
Admin-managed pricing plans
```javascript
{
  id: "starter",
  name: "Starter",
  namePortuguese: "Iniciante",
  price: 10,
  currency: "EUR",
  interval: "month",
  popular: true,
  description: { en: "...", pt: "..." },
  highlights: { en: [...], pt: [...] },
  features: { users: 3, products: 500, ... }
}
```

### /payments
Payment transactions
```javascript
{
  userId: "user123",
  companyId: "company456",
  planId: "starter",
  amount: 10,
  originalAmount: 12,
  discountApplied: { code: "PROMO20", value: 2 },
  method: "mbway" | "multibanco",
  status: "pending" | "paid" | "failed",
  eupagoReference: "...",
  eupagoEntity: "...",
  createdAt: Timestamp,
  paidAt: Timestamp
}
```

### /companies
Subscription data
```javascript
{
  ownerId: "user123",
  subscriptionPlan: "starter",
  subscriptionStatus: "active" | "trial" | "cancelled",
  subscriptionStartDate: Timestamp,
  lastPaymentDate: Timestamp,
  lastPaymentAmount: 10
}
```

### /promoCodes
Discount codes
```javascript
{
  code: "PROMO2025",
  type: "percentage" | "fixed_amount",
  value: 20,
  active: true,
  validFrom: Timestamp,
  validUntil: Timestamp,
  maxUses: 100,
  currentUses: 0
}
```

## Security Rules

All payment-related collections are protected:

```javascript
// Only super_admin can access
match /payments/{paymentId} {
  allow read, write: if isSuperAdmin();
}

match /promoCodes/{promoId} {
  allow read: if request.auth != null; // Authenticated users can read
  allow write: if isSuperAdmin(); // Only admin can create/edit
}

match /plans/{planId} {
  allow read: if true; // Public read for pricing page
  allow write: if isSuperAdmin(); // Only admin can modify
}
```

## Testing

### Test Promo Code
```javascript
// Create test promo code in Firestore
{
  code: "TEST20",
  type: "percentage",
  value: 20,
  active: true,
  maxUses: 999
}
```

### Test MB WAY Payment
Use a test phone number provided by Eupago for testing.

### Test Multibanco
Eupago provides test references that automatically succeed after a few seconds.

## Monitoring

### View Payments
Admin Dashboard → Payments

### View Subscriptions
Admin Dashboard → Subscriptions

### Export Data
Use the CSV export feature in payments view

## Troubleshooting

### Payment not received
1. Check webhook logs in Firebase Console
2. Verify signature secret matches Eupago
3. Check payment status in Firestore `/payments`

### Promo code not working
1. Verify code is active in `/promoCodes`
2. Check validFrom and validUntil dates
3. Verify maxUses not exceeded

### Subscription not activated
1. Check payment status is "paid"
2. Verify webhook processed successfully
3. Check company subscription status

## Production Checklist

- [ ] Eupago API key configured
- [ ] Webhook secret configured
- [ ] Cloud functions deployed
- [ ] Webhook URL configured in Eupago
- [ ] Firestore security rules deployed
- [ ] Test payment flow end-to-end
- [ ] Test promo codes
- [ ] Configure pricing plans in admin panel
- [ ] Test webhook with real payments

## Support

- Eupago Documentation: https://eupago.pt/documentacao/
- Firebase Functions: https://firebase.google.com/docs/functions
- AllInStock Support: [Your support email]
