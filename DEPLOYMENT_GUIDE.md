# AllInStock CRM - Deployment Guide

## Current Deployment Status

✅ **Application is LIVE** at: https://allinstock-ddb69.web.app

## Custom Domain Setup (allinstock.pt)

To configure your custom domain **www.allinstock.pt**, follow these steps:

### Step 1: Add Custom Domain in Firebase Console

1. Go to Firebase Console: https://console.firebase.google.com/project/allinstock-ddb69/hosting
2. Click on "Add custom domain"
3. Enter your domain: `allinstock.pt`
4. Click "Continue"
5. Firebase will provide DNS records to configure

### Step 2: Configure DNS Records

You'll need to add these DNS records at your domain registrar (where you registered allinstock.pt):

#### For Root Domain (allinstock.pt):
```
Type: A
Name: @
Value: [Firebase will provide IP addresses]
```

#### For WWW Subdomain (www.allinstock.pt):
```
Type: CNAME
Name: www
Value: [Firebase will provide the target]
```

### Step 3: Verify Domain Ownership

Firebase will provide a TXT record for verification:
```
Type: TXT
Name: @
Value: [Firebase verification code]
```

Add this to your DNS settings and wait for verification (can take up to 24 hours).

### Step 4: SSL Certificate

Once verified, Firebase automatically provisions a free SSL certificate for your domain. This can take up to 24 hours.

---

## Deploy Cloud Functions

Before deploying functions, you need to set Eupago credentials:

### Set Environment Variables

```bash
firebase functions:config:set eupago.api_key="YOUR_EUPAGO_API_KEY"
firebase functions:config:set eupago.webhook_secret="YOUR_EUPAGO_WEBHOOK_SECRET"
```

### Deploy Functions

```bash
cd D:\allinstock
firebase deploy --only functions
```

This will deploy:
- `createMbWayPayment` - MB WAY payment processing
- `createMultibancoPayment` - Multibanco reference generation
- `eupagoWebhook` - Payment notification handler

### Configure Webhook in Eupago

After deploying functions, configure the webhook URL in your Eupago dashboard:

```
https://us-central1-allinstock-ddb69.cloudfunctions.net/eupagoWebhook
```

---

## Complete Deployment (All Services)

To deploy everything at once:

```bash
cd D:\allinstock

# Build the app
npm run build

# Deploy all services
firebase deploy
```

This will deploy:
- ✅ Firestore Rules
- ✅ Hosting (Web App)
- ✅ Cloud Functions (Payment Processing)

---

## Deployment Checklist

### Before Going Live

- [ ] Build production version: `npm run build`
- [ ] Deploy hosting: `firebase deploy --only hosting`
- [ ] Configure custom domain in Firebase Console
- [ ] Update DNS records at domain registrar
- [ ] Wait for domain verification
- [ ] Set Eupago credentials: `firebase functions:config:set`
- [ ] Deploy cloud functions: `firebase deploy --only functions`
- [ ] Configure Eupago webhook URL
- [ ] Test payment flow (MB WAY and Multibanco)
- [ ] Create initial pricing plans in admin panel
- [ ] Create test promo codes

### Admin Panel Setup

1. **Login as Super Admin**
   - Email: [Your admin email]
   - Navigate to: https://allinstock.pt/admin

2. **Configure Payment Settings**
   - Settings → Payment
   - Enter Eupago API Key
   - Enable Eupago Payments

3. **Create Pricing Plans**
   - Admin → Plans
   - Create/Edit plans for your business

4. **Create Promo Codes (Optional)**
   - Admin → Promo Codes
   - Create discount codes for marketing

---

## Monitoring & Maintenance

### View Logs

**Hosting Logs:**
```bash
firebase hosting:logs
```

**Function Logs:**
```bash
firebase functions:log
```

**Or view in Firebase Console:**
- Hosting: https://console.firebase.google.com/project/allinstock-ddb69/hosting
- Functions: https://console.firebase.google.com/project/allinstock-ddb69/functions

### Analytics

Enable Google Analytics in Firebase Console for user tracking and analytics.

---

## Rollback Procedure

If you need to rollback to a previous version:

```bash
# List hosting versions
firebase hosting:rollback

# Rollback functions
firebase functions:rollback FUNCTION_NAME
```

---

## Update Deployment

When you make changes to the code:

### Frontend Changes Only
```bash
npm run build
firebase deploy --only hosting
```

### Cloud Functions Changes Only
```bash
firebase deploy --only functions
```

### Firestore Rules Changes Only
```bash
firebase deploy --only firestore:rules
```

---

## Environment-Specific Configuration

### Production Firebase Config

Make sure your [src/config/firebase.js](src/config/firebase.js) has the correct production config:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "allinstock-ddb69.firebaseapp.com",
  projectId: "allinstock-ddb69",
  storageBucket: "allinstock-ddb69.firebasestorage.app",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

---

## Performance Optimization

### Build Optimization

The current build shows:
- Bundle size: 1.11 MB (gzipped: 269 KB)
- CSS size: 173 KB (gzipped: 24 KB)

### Recommended Improvements

1. **Code Splitting**: Implement dynamic imports for routes
2. **Image Optimization**: Use WebP format for images
3. **Lazy Loading**: Load components on demand
4. **CDN**: Firebase Hosting already uses CDN

---

## Security Checklist

- ✅ Firestore security rules deployed
- ✅ HTTPS enabled (Firebase automatic)
- ✅ Authentication required for protected routes
- ✅ Super admin role for sensitive operations
- ✅ Payment webhook signature verification
- [ ] Enable Firebase App Check (recommended)
- [ ] Set up CORS policies if needed
- [ ] Configure Content Security Policy headers

---

## Backup Strategy

### Firestore Backup

```bash
# Export Firestore data
firebase firestore:export gs://allinstock-ddb69.appspot.com/backups
```

### Scheduled Backups

Set up scheduled exports in Google Cloud Console:
https://console.cloud.google.com/firestore/import-export?project=allinstock-ddb69

---

## Support & Resources

- **Firebase Console**: https://console.firebase.google.com/project/allinstock-ddb69
- **Hosting URL**: https://allinstock-ddb69.web.app
- **Custom Domain** (after setup): https://www.allinstock.pt
- **Eupago Documentation**: https://eupago.pt/documentacao/
- **Payment Integration Guide**: See [PAYMENT_INTEGRATION.md](PAYMENT_INTEGRATION.md)
- **Functions Documentation**: See [functions/README.md](functions/README.md)

---

## Troubleshooting

### Site Not Loading
1. Check Firebase Hosting status
2. Verify build completed successfully
3. Check browser console for errors

### Custom Domain Not Working
1. Verify DNS records are correctly configured
2. Wait up to 24 hours for propagation
3. Check SSL certificate status in Firebase Console

### Payment Not Working
1. Verify cloud functions are deployed
2. Check Eupago credentials are set
3. Verify webhook URL is configured in Eupago
4. Check function logs for errors

### 404 Errors on Refresh
- This should not happen as SPA rewrites are configured
- Verify firebase.json has the correct rewrite rules

---

## Cost Estimation

**Firebase Free Tier Includes:**
- 10 GB hosting storage
- 360 MB/day hosting transfer
- 50,000 Firestore reads/day
- 20,000 Firestore writes/day
- 125K Cloud Functions invocations/month

**Estimated Monthly Costs (after free tier):**
- Small business: $5-20/month
- Medium business: $20-50/month
- Large business: $50-200/month

Monitor usage: https://console.firebase.google.com/project/allinstock-ddb69/usage

---

## Next Steps

1. ✅ Application deployed to Firebase
2. ⏳ Configure custom domain (follow steps above)
3. ⏳ Deploy cloud functions with Eupago credentials
4. ⏳ Test payment system end-to-end
5. ⏳ Set up monitoring and alerts
6. ⏳ Configure backup strategy
7. ⏳ Enable Google Analytics

---

**Deployment completed on:** 2025-11-02

**Project ID:** allinstock-ddb69

**Live URL:** https://allinstock-ddb69.web.app

**Target Custom Domain:** www.allinstock.pt
