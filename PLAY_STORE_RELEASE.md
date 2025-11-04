# AllInStock - Google Play Store Release Guide

## App Information
- **App Name:** AllInStock
- **Package Name:** pt.allinstock.crm
- **Version:** 1.0 (versionCode: 1)
- **Website:** https://allinstock-ded6e.web.app

## Keystore Information
**⚠️ CRITICAL - BACKUP THIS FILE AND NEVER LOSE IT!**

- **File Location:** `D:\allinstock\android\allinstock-release-key.keystore`
- **Store Password:** `AllInStock2025!`
- **Key Alias:** `allinstock`
- **Key Password:** `AllInStock2025!`

## App Icons
✅ Generated in all required sizes
- Location: `android/app/src/main/res/mipmap-*/`
- Play Store icon (1024x1024): `android/app/src/main/play-store/icon-1024.png`

## Build Instructions

### Option 1: Build in Android Studio (Recommended)

1. **Open Android Studio** (already open via `npx cap open android`)

2. **Build App Bundle** (preferred for Play Store):
   - Menu: Build → Generate Signed Bundle / APK
   - Select: **Android App Bundle**
   - Click: Next
   - **Key store path:** Browse to `D:\allinstock\android\allinstock-release-key.keystore`
   - **Key store password:** `AllInStock2025!`
   - **Key alias:** `allinstock`
   - **Key password:** `AllInStock2025!`
   - Click: Next
   - Select: **release** build variant
   - Click: Finish

3. **Output Location:**
   - AAB: `D:\allinstock\android\app\build\outputs\bundle\release\app-release.aab`

### Option 2: Build APK (for direct sharing/testing)

1. In Android Studio:
   - Menu: Build → Generate Signed Bundle / APK
   - Select: **APK**
   - Follow same signing steps as above

2. **Output Location:**
   - APK: `D:\allinstock\android\app\build\outputs\apk\release\app-release.apk`

### Option 3: Command Line Build

```bash
# Build App Bundle (for Play Store)
cd D:\allinstock\android
gradlew.bat bundleRelease

# Build APK (for testing)
cd D:\allinstock\android
gradlew.bat assembleRelease
```

## Play Store Publishing Checklist

### Required Assets

- [x] App icon (1024x1024) - `android/app/src/main/play-store/icon-1024.png`
- [ ] Feature graphic (1024x500)
- [ ] Screenshots (minimum 2, recommend 8)
  - Phone: 16:9 ratio, min 320px
  - Tablet: recommended
- [ ] Short description (max 80 characters)
- [ ] Full description (max 4000 characters)
- [ ] Privacy Policy URL
- [ ] Content rating (complete questionnaire)

### App Information to Provide

**Category:** Business / Productivity

**Short Description:**
"Complete CRM for stock management, quotations, invoices and client management"

**Full Description:**
```
AllInStock - Complete Business Management CRM

Manage your entire business from one powerful app:

📦 STOCK MANAGEMENT
- Track inventory in real-time
- Multiple stock locations
- Product categories and families
- Low stock alerts

💼 CLIENT & SUPPLIER MANAGEMENT
- Complete contact management
- Purchase history
- Notes and interactions

📋 QUOTATIONS & INVOICES
- Create professional quotations
- Convert to invoices
- PDF export
- Email integration

📊 REPORTS & ANALYTICS
- Sales reports
- Stock value analysis
- Product performance
- Real-time dashboard

📧 EMAIL HUB
- Integrated Gmail
- Email tracking
- Client communication

📅 CALENDAR
- Schedule appointments
- Task management
- Reminders

🔐 SECURE & RELIABLE
- Firebase backend
- Secure authentication
- Real-time sync
- Cloud backup

Perfect for small to medium businesses looking to streamline operations and grow efficiently.
```

### Privacy Policy
You need to provide a privacy policy URL. Create one at:
- https://www.freeprivacypolicy.com/
- https://www.termsfeed.com/

### Content Rating
Complete Google's content rating questionnaire in Play Console

### Pricing
- Free with subscription plans (Free, Pro €19.99/month, Enterprise €99.99/month)

## After Building

1. **Test the release build** on your Samsung device
2. **Create Play Console account** at https://play.google.com/console
3. **Pay one-time registration fee** ($25)
4. **Upload the AAB file** (app-release.aab)
5. **Fill in all store listing information**
6. **Submit for review**

## Version Updates

To release updates:
1. Update version in `android/app/build.gradle`:
   ```gradle
   versionCode 2  // Increment this
   versionName "1.1"  // Update this
   ```
2. Build web: `npm run build`
3. Sync: `npx cap sync android`
4. Build new release AAB
5. Upload to Play Console

## Support

- Firebase Console: https://console.firebase.google.com/project/allinstock-ded6e
- Play Console: https://play.google.com/console
