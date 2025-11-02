# Eupago Payment Integration Setup Guide

**Date**: 2025-11-02
**Project**: AllInStock CRM
**Firebase Project**: allinstock-ded6e

---

## Step 1: Complete Eupago Channel Setup

You're currently on the "Adicionar Canal" (Add Channel) page in Eupago. Here's what to fill in:

### Form Fields:

1. **Nome (Name)**:
   ```
   AllInStock CRM
   ```

2. **Descrição (Description)**:
   ```
   Sistema de gestão AllInStock - Pagamentos de subscrições
   ```

3. **Email**:
   ```
   allinstockpro@gmail.com
   ```
   (Use your business email address)

4. **URL (Endereço web do novo canal)**:
   ```
   https://allinstock.pt
   ```
   (Your custom domain)

5. Click **"Adicionar Canal"** button

---

## Step 2: Obtain API Credentials

After creating the channel, you need to get your API credentials:

### 2.1 Find API Key

1. In Eupago dashboard, go to **"Configurações"** or **"API"** section
2. Look for **"Chave API"** or **"API Key"**
3. Copy the API key (format: usually a long alphanumeric string)

Example format: `demo-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

### 2.2 Generate Webhook Secret

1. In Eupago dashboard, find **"Webhooks"** or **"Notificações"** section
2. Look for **"Webhook Secret"** or **"Chave de Segurança"**
3. Generate or copy the webhook secret
4. If there's no webhook secret, you can create a strong random string:
   ```
   Use a password generator to create a 32+ character random string
   Example: npx crypto-random-string --length 64
   ```

---

## Step 3: Create .env File for Cloud Functions

Once you have both credentials, create the environment file:

### 3.1 Navigate to functions folder:
```bash
cd D:\allinstock\functions
```

### 3.2 Create .env file:
```bash
# Copy the example file
copy .env.example .env

# Or create new file with your credentials
```

### 3.3 Edit .env file with your actual credentials:

Open `D:\allinstock\functions\.env` and add:

```env
# Eupago Payment Gateway Credentials
# Get these from your Eupago dashboard at https://eupago.pt/

EUPAGO_API_KEY=your_actual_api_key_here
EUPAGO_WEBHOOK_SECRET=your_actual_webhook_secret_here
```

**IMPORTANT**: Replace the placeholder values with your real credentials from Eupago!

---

## Step 4: Deploy Cloud Functions

After creating the .env file with real credentials:

### 4.1 Return to project root:
```bash
cd D:\allinstock
```

### 4.2 Deploy functions:
```bash
firebase deploy --only functions
```

This will deploy three payment functions:
- `createMbWayPayment` - MB WAY payment processing
- `createMultibancoPayment` - Multibanco reference generation
- `eupagoWebhook` - Payment notification handler

### 4.3 Expected Output:
```
✔ functions[createMbWayPayment(us-central1)] Successful create operation.
✔ functions[createMultibancoPayment(us-central1)] Successful create operation.
✔ functions[eupagoWebhook(us-central1)] Successful create operation.
```

---

## Step 5: Configure Webhook in Eupago

After deploying functions, you need to configure the webhook URL in Eupago:

### 5.1 Get Webhook URL:

Your webhook URL will be:
```
https://us-central1-allinstock-ded6e.cloudfunctions.net/eupagoWebhook
```

### 5.2 Add Webhook to Eupago:

1. In Eupago dashboard, go to **"Webhooks"** or **"Notificações"**
2. Click **"Adicionar Webhook"** or **"Add Webhook"**
3. Paste the webhook URL
4. Select events to notify (select all payment events):
   - Payment Created
   - Payment Successful
   - Payment Failed
   - Payment Expired
5. Save the webhook configuration

---

## Step 6: Test Payment Integration

### 6.1 Test MB WAY Payment:

1. Go to https://allinstock.pt
2. Select a subscription plan
3. Choose MB WAY as payment method
4. Enter test phone number: `+351912345678` (or your real number)
5. Check if payment request is created

### 6.2 Test Multibanco Payment:

1. Go to https://allinstock.pt
2. Select a subscription plan
3. Choose Multibanco as payment method
4. Check if entity and reference are generated

### 6.3 Monitor in Firebase Console:

1. Go to https://console.firebase.google.com/project/allinstock-ded6e/functions
2. Check function logs for any errors
3. Go to Firestore and check `payments` collection for payment records

---

## Troubleshooting

### Issue: Functions deployment fails with "Missing environment variables"

**Solution**: Make sure .env file exists in `D:\allinstock\functions\.env` with real credentials (not placeholder values)

### Issue: Webhook signature validation fails

**Solution**:
1. Ensure EUPAGO_WEBHOOK_SECRET in .env matches exactly what's configured in Eupago dashboard
2. Check function logs: `firebase functions:log`

### Issue: API key invalid error

**Solution**:
1. Double-check API key is copied correctly (no extra spaces)
2. Verify API key is active in Eupago dashboard
3. Check if API key has correct permissions for MB WAY and Multibanco

---

## Important Notes

1. **Never commit .env file to Git**:
   - The .env file is already in .gitignore
   - It contains sensitive credentials

2. **Environment Variables in Firebase**:
   - Firebase Functions v2 uses defineString() to load environment variables
   - Variables are automatically loaded from .env during deployment
   - In production, they're stored securely in Firebase

3. **Eupago Test vs Production**:
   - Eupago may have separate credentials for testing and production
   - Start with test credentials to verify everything works
   - Switch to production credentials when ready to accept real payments

4. **Webhook Security**:
   - The webhook validates signatures using HMAC-SHA256
   - This prevents unauthorized payment notifications
   - Keep EUPAGO_WEBHOOK_SECRET secure and never share it

---

## Checklist

Before deploying functions, verify:

- [ ] Eupago channel created ("Adicionar Canal" completed)
- [ ] API Key obtained from Eupago dashboard
- [ ] Webhook Secret obtained/generated
- [ ] .env file created in `D:\allinstock\functions\.env`
- [ ] .env file contains real credentials (not placeholders)
- [ ] Firebase Blaze plan is active (already done ✓)
- [ ] Functions code is ready (already done ✓)

After deploying functions, verify:

- [ ] All three functions deployed successfully
- [ ] Webhook URL configured in Eupago dashboard
- [ ] Test payment creates record in Firestore
- [ ] Webhook receives notifications

---

## Support Resources

- **Eupago Documentation**: https://eupago.pt/documentacao/
- **Eupago API Reference**: https://eupago.pt/documentacao/api/
- **Firebase Functions Logs**: `firebase functions:log`
- **Firebase Console Functions**: https://console.firebase.google.com/project/allinstock-ded6e/functions
- **Firebase Console Firestore**: https://console.firebase.google.com/project/allinstock-ded6e/firestore

---

## Next Steps Summary

1. **Right Now**: Fill in the "Adicionar Canal" form in Eupago and submit
2. **Then**: Find your API Key in Eupago dashboard (look for "API" or "Configurações")
3. **Then**: Get or generate Webhook Secret
4. **Then**: Create `D:\allinstock\functions\.env` file with real credentials
5. **Then**: Run `firebase deploy --only functions` from `D:\allinstock`
6. **Finally**: Configure webhook URL in Eupago dashboard

Once completed, your payment system will be fully operational!
