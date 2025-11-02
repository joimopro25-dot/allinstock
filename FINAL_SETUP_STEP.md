# Final Setup Step - Configure Eupago Webhook

**Date**: 2025-11-02
**Status**: Almost complete! Just one final step remaining.

---

## 🎉 What's Already Done

✅ **AllInStock CRM is LIVE** at https://allinstock.pt
✅ **All Cloud Functions deployed successfully**
✅ **Eupago API credentials configured**
✅ **Payment integration code ready**

---

## 🔧 Final Step: Configure Webhook in Eupago

Now that the Cloud Functions are deployed, you need to add the webhook URL to your Eupago channel.

### Step-by-Step Instructions:

1. **Go back to the Eupago channel page** you were just on:
   - URL: https://clientes.eupago.pt/backoffice/index.html
   - Navigate to: Gestão / Conta / Listagem de Canais
   - Click **"Editar"** on the **AllInStock CRM** channel

2. **Scroll down to the "Webhooks 2.0" section**

3. **Fill in the Webhook Endpoint field**:
   ```
   https://us-central1-allinstock-ded6e.cloudfunctions.net/eupagoWebhook
   ```

4. **Click "Gerar Chave Criptográfica"** if you haven't already
   - This generates the cryptographic key for webhook security
   - The system has already been configured with this secret

5. **Make sure these webhook types are selected**:
   - ✅ Pagamento (Payment)
   - ✅ Erro (Error)

6. **Click "Guardar" (Save)**

This time it should work because the Cloud Function endpoint now exists!

---

## 📝 Important Information

### Your Eupago Credentials (KEEP SECURE):
- **API Key**: `a053-dc34-de1c-eb62-22ce`
- **Webhook Secret**: `646f1581a312bdb43c704b6c296c308a3685116df50ae281caff626d9d46f8f2`
- **Webhook URL**: `https://us-central1-allinstock-ded6e.cloudfunctions.net/eupagoWebhook`

These credentials are stored in `D:\allinstock\functions\.env` (this file is NOT committed to Git for security).

### Your Deployed Cloud Functions:

1. **createMbWayPayment**
   - URL: https://us-central1-allinstock-ded6e.cloudfunctions.net/createMbWayPayment
   - Purpose: Creates MB WAY payment requests

2. **createMultibancoPayment**
   - URL: https://us-central1-allinstock-ded6e.cloudfunctions.net/createMultibancoPayment
   - Purpose: Generates Multibanco payment references

3. **eupagoWebhook**
   - URL: https://us-central1-allinstock-ded6e.cloudfunctions.net/eupagoWebhook
   - Purpose: Receives payment notifications from Eupago

---

## ✅ Testing After Setup

Once you've configured the webhook in Eupago, you can test the payment system:

### Test MB WAY Payment:
1. Go to https://allinstock.pt
2. Click on a subscription plan
3. Choose MB WAY payment method
4. Enter a Portuguese phone number (format: +351XXXXXXXXX)
5. Complete the payment on your phone

### Test Multibanco Payment:
1. Go to https://allinstock.pt
2. Click on a subscription plan
3. Choose Multibanco payment method
4. You'll receive an Entity and Reference number
5. Use these to make a payment at any ATM or online banking

### Monitor Payments:
- **Firebase Console**: https://console.firebase.google.com/project/allinstock-ded6e/firestore
- Check the `payments` collection for payment records
- **Function Logs**: https://console.firebase.google.com/project/allinstock-ded6e/functions

---

## 🎯 After This Final Step

Once you save the webhook configuration in Eupago, your payment system will be **fully operational**:

1. ✅ Users can purchase subscriptions with MB WAY
2. ✅ Users can purchase subscriptions with Multibanco
3. ✅ Payments are automatically verified via webhook
4. ✅ Subscriptions are automatically activated when payment succeeds
5. ✅ All payment data is stored in Firestore

---

## 🆘 If You Need Help

### Webhook configuration fails:
- Make sure you copied the webhook URL exactly
- Verify the webhook types (Pagamento, Erro) are selected
- Try clicking "Gerar Chave Criptográfica" again

### Payments not working:
- Check Firebase Functions logs: `firebase functions:log`
- Check Firestore `payments` collection for error messages
- Verify API key is correct in Eupago dashboard

### Questions:
- Review [DEPLOYMENT_STATUS.md](./DEPLOYMENT_STATUS.md)
- Review [EUPAGO_SETUP_GUIDE.md](./EUPAGO_SETUP_GUIDE.md)
- Check Firebase Console for logs and errors

---

**You're almost there! Just configure that webhook URL and your payment system will be live! 🚀**
