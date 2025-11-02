# AllInStock Cloud Functions

This directory contains Firebase Cloud Functions for the AllInStock CRM, specifically for payment processing via Eupago.

## Setup

1. Install dependencies:
```bash
cd functions
npm install
```

2. Configure environment variables:

### Option A: Using Firebase Functions Config (Recommended for Production)
```bash
firebase functions:config:set eupago.api_key="YOUR_EUPAGO_API_KEY"
firebase functions:config:set eupago.webhook_secret="YOUR_WEBHOOK_SECRET"
```

### Option B: Using .env file (For Local Development)
```bash
cp .env.example .env
# Edit .env and add your credentials
```

3. Deploy functions:
```bash
# From the root directory
firebase deploy --only functions

# Or deploy specific functions
firebase deploy --only functions:createMbWayPayment
firebase deploy --only functions:createMultibancoPayment
firebase deploy --only functions:eupagoWebhook
```

## Available Functions

### createMbWayPayment
Creates a payment request via euPago MB WAY.

**Parameters:**
- `amount` (number): Payment amount in EUR
- `phoneNumber` (string): Phone number for MB WAY (9 digits)
- `planId` (string): Selected plan ID
- `userId` (string): User ID
- `companyId` (string, optional): Company ID
- `promoCode` (string, optional): Promo code

**Returns:**
- `success` (boolean)
- `paymentId` (string): Payment document ID
- `reference` (string): MB WAY reference
- `amount` (number): Final amount after discount
- `discountApplied` (object, optional): Discount details

### createMultibancoPayment
Generates a Multibanco reference via euPago.

**Parameters:**
- `amount` (number): Payment amount in EUR
- `planId` (string): Selected plan ID
- `userId` (string): User ID
- `companyId` (string, optional): Company ID
- `promoCode` (string, optional): Promo code

**Returns:**
- `success` (boolean)
- `paymentId` (string): Payment document ID
- `entity` (string): Multibanco entity
- `reference` (string): Multibanco reference
- `amount` (number): Final amount after discount
- `discountApplied` (object, optional): Discount details

### eupagoWebhook
Processes payment notifications from euPago.

**HTTP Endpoint:** POST `/eupagoWebhook`

This webhook:
1. Verifies signature from euPago
2. Updates payment status in Firestore
3. Activates subscription when payment is successful
4. Creates company record if needed

## Firestore Collections Used

- `/payments` - Payment transactions
- `/users` - User accounts
- `/companies` - Company/subscription data
- `/promoCodes` - Discount codes

## Security

- All callable functions require authentication
- Webhook verifies signature using HMAC-SHA256
- Only super_admin can access payment data

## Testing

### Local Emulator
```bash
firebase emulators:start
```

### Test MB WAY Payment
```javascript
const createMbWayPayment = httpsCallable(functions, 'createMbWayPayment');
const result = await createMbWayPayment({
  amount: 10.00,
  phoneNumber: '912345678',
  planId: 'starter',
  userId: 'user123'
});
```

### Test Multibanco Payment
```javascript
const createMultibancoPayment = httpsCallable(functions, 'createMultibancoPayment');
const result = await createMultibancoPayment({
  amount: 15.00,
  planId: 'professional',
  userId: 'user123'
});
```

## Webhook Configuration

Configure the webhook URL in your Eupago dashboard:
```
https://YOUR_PROJECT.cloudfunctions.net/eupagoWebhook
```

Make sure to set the webhook secret in both Eupago dashboard and Firebase config.

## Support

For issues related to:
- Eupago API: https://eupago.pt/documentacao/
- Firebase Functions: https://firebase.google.com/docs/functions
