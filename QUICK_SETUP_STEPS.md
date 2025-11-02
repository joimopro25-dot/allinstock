# Quick Setup Steps for allinstock.pt

## 🎯 Current Status
✅ App deployed to Firebase: https://allinstock-ddb69.web.app
✅ DNS records configured in Dominios.pt (I can see dns1-4.host-redirect entries)
⏳ Custom domain needs to be added in Firebase

---

## 📝 Step-by-Step Instructions

### STEP 1: Add Custom Domain in Firebase Console ⬅️ **START HERE**

You're already in the right place in Firebase Console!

1. Click the button **"Adicionar um domínio personalizado"** (Add custom domain)
2. Enter your domain: **allinstock.pt**
3. Also add: **www.allinstock.pt**
4. Click Continue

Firebase will provide you with DNS records.

---

### STEP 2: Verify Current DNS Records

Based on your screenshot, you currently have these DNS records set up:
- `allinstock.pt` → Points to `dns1.host-redirect`
- `allinstock.pt` → Points to `dns2.host-redirect`
- `allinstock.pt` → Points to `dns3.host-redirect`
- `allinstock.pt` → Points to `dns4.host-redirect`

**⚠️ These need to be REPLACED with Firebase's A records!**

---

### STEP 3: Update DNS Records in Dominios.pt

After Firebase provides the records, you need to:

1. Go back to Dominios.pt → DNS management for allinstock.pt
2. **DELETE** all existing A records (dns1-4.host-redirect)
3. **ADD** the new A records that Firebase provides (usually 2 IP addresses)
4. **ADD** the TXT record for domain verification
5. **ADD** CNAME record for www subdomain

#### Example of what Firebase will give you:
```
Type: A
Name: @
Value: 151.101.1.195

Type: A
Name: @
Value: 151.101.65.195

Type: TXT
Name: @
Value: [Firebase verification string]

Type: CNAME
Name: www
Value: allinstock-ddb69.web.app
```

---

### STEP 4: Wait for Verification

- DNS propagation: 5 minutes to 24 hours (usually ~15 minutes)
- Firebase will automatically verify
- SSL certificate will be issued automatically (free)

---

### STEP 5: Deploy Cloud Functions (IMPORTANT!)

Once the domain is working, deploy the payment functions:

```bash
# Open PowerShell/Terminal
cd D:\allinstock

# Set your Eupago credentials (replace with real values)
firebase functions:config:set eupago.api_key="YOUR_EUPAGO_API_KEY_HERE"
firebase functions:config:set eupago.webhook_secret="YOUR_WEBHOOK_SECRET_HERE"

# Deploy functions
firebase deploy --only functions
```

---

### STEP 6: Configure Eupago Webhook

After functions are deployed, configure this URL in Eupago dashboard:
```
https://us-central1-allinstock-ddb69.cloudfunctions.net/eupagoWebhook
```

---

## 🚀 Expected Timeline

| Step | Time Required |
|------|---------------|
| Add domain in Firebase | 2 minutes |
| Update DNS records | 5 minutes |
| DNS propagation | 15 min - 24 hours |
| SSL certificate issued | Automatic (after verification) |
| Deploy functions | 3-5 minutes |
| Configure Eupago | 2 minutes |

**Total estimated time: 30 minutes to 24 hours** (mostly waiting for DNS)

---

## ✅ How to Verify It's Working

### Check DNS Propagation
Visit: https://dnschecker.org/
Enter: `allinstock.pt`

### Check Site is Live
Visit: https://allinstock.pt (after DNS propagates)
Should redirect to: https://www.allinstock.pt

### Check SSL Certificate
Look for 🔒 padlock in browser address bar

---

## 🆘 Troubleshooting

### Domain not resolving?
- Check DNS records are correct in Dominios.pt
- Wait longer (DNS can take up to 24 hours)
- Clear browser cache
- Try in incognito mode

### "Not Secure" warning?
- Wait for SSL certificate (up to 24 hours after DNS verification)
- Check Firebase Console → Hosting → Domain status

### Payments not working?
- Verify functions are deployed: `firebase functions:list`
- Check function logs: `firebase functions:log`
- Verify Eupago webhook is configured

---

## 📞 Need Help?

- Firebase Hosting Docs: https://firebase.google.com/docs/hosting
- Firebase Console: https://console.firebase.google.com/project/allinstock-ddb69/hosting
- DNS Checker: https://dnschecker.org/

---

**Current Action Required:** Click "Adicionar um domínio personalizado" in Firebase Console → Enter "allinstock.pt"
