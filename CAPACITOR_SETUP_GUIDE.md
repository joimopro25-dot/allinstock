# Capacitor Setup Guide for AllInStock

## Complete Step-by-Step Guide to Convert Web App to Android/iOS

### Prerequisites

- ✅ Node.js and npm installed
- ✅ For Android: Android Studio installed
- ✅ For iOS: macOS with Xcode installed (iOS only works on Mac)

### Step 1: Install Capacitor

```bash
# Install Capacitor core and CLI
npm install @capacitor/core @capacitor/cli --save

# Initialize Capacitor in your project
npx cap init
```

When prompted:
- **App name**: `AllInStock`
- **App ID**: `com.allinstock.app` (reverse domain notation)
- **Web asset directory**: `dist` (Vite's build output)

### Step 2: Add Platforms

```bash
# Add Android
npm install @capacitor/android
npx cap add android

# Add iOS (macOS only)
npm install @capacitor/ios
npx cap add ios
```

### Step 3: Build Your Web App

```bash
# Build the Vite app
npm run build

# This creates the 'dist' folder with your compiled app
```

### Step 4: Sync Web Assets to Native Projects

```bash
# Sync all platforms
npx cap sync

# Or sync specific platform
npx cap sync android
npx cap sync ios
```

### Step 5: Open in Native IDE

```bash
# Open Android Studio
npx cap open android

# Open Xcode (macOS only)
npx cap open ios
```

### Step 6: Configure Android Project

#### Update AndroidManifest.xml

Location: `android/app/src/main/AndroidManifest.xml`

Add permissions:
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/>
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"/>
<uses-permission android:name="android.permission.CAMERA" />
```

#### Update capacitor.config.json

```json
{
  "appId": "com.allinstock.app",
  "appName": "AllInStock",
  "webDir": "dist",
  "server": {
    "androidScheme": "https",
    "cleartext": true
  },
  "android": {
    "buildOptions": {
      "keystorePath": "release.keystore",
      "keystorePassword": "your-password",
      "keystoreAlias": "allinstock",
      "keystoreAliasPassword": "your-alias-password",
      "releaseType": "APK"
    }
  },
  "ios": {
    "contentInset": "automatic"
  }
}
```

### Step 7: Essential Capacitor Plugins

```bash
# Status Bar Control
npm install @capacitor/status-bar
npx cap sync

# Splash Screen
npm install @capacitor/splash-screen
npx cap sync

# Keyboard Control
npm install @capacitor/keyboard
npx cap sync

# Network Status
npm install @capacitor/network
npx cap sync

# Secure Storage
npm install @capacitor/preferences
npx cap sync

# Camera (for product photos)
npm install @capacitor/camera
npx cap sync

# Filesystem (for PDF exports)
npm install @capacitor/filesystem
npx cap sync

# Share (to share documents)
npm install @capacitor/share
npx cap sync
```

### Step 8: Update Your Code to Use Capacitor

Create a new file: `src/utils/capacitor.js`

```javascript
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';

export const isNative = () => Capacitor.isNativePlatform();
export const getPlatform = () => Capacitor.getPlatform(); // 'web', 'ios', 'android'

// Initialize Capacitor features
export const initializeCapacitor = async () => {
  if (isNative()) {
    // Set status bar
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#0f0f23' });

    // Hide splash screen
    await SplashScreen.hide();
  }
};

// Export utility functions
export { StatusBar, SplashScreen };
```

Update `src/main.jsx`:

```javascript
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/responsive.css'
import App from './App.jsx'
import { initializeCapacitor } from './utils/capacitor'

// Initialize Capacitor when on native platform
initializeCapacitor();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

### Step 9: Build Development APK

#### In Android Studio:

1. Click **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
2. Wait for build to complete
3. Click **locate** in the notification
4. APK will be in: `android/app/build/outputs/apk/debug/app-debug.apk`

#### Or via Command Line:

```bash
cd android
./gradlew assembleDebug
cd ..
```

### Step 10: Build Release APK

#### Create a Keystore:

```bash
cd android/app
keytool -genkey -v -keystore release.keystore -alias allinstock -keyalg RSA -keysize 2048 -validity 10000
cd ../..
```

#### Update build.gradle:

Location: `android/app/build.gradle`

Add before `android` block:
```gradle
def keystorePropertiesFile = rootProject.file("key.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}
```

Inside `android` block, add:
```gradle
signingConfigs {
    release {
        keyAlias keystoreProperties['keyAlias']
        keyPassword keystoreProperties['keyPassword']
        storeFile file(keystoreProperties['storeFile'])
        storePassword keystoreProperties['storePassword']
    }
}

buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled false
        proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
    }
}
```

#### Create key.properties:

Location: `android/key.properties`

```properties
storePassword=your-keystore-password
keyPassword=your-key-password
keyAlias=allinstock
storeFile=app/release.keystore
```

#### Build Release APK:

```bash
cd android
./gradlew assembleRelease
cd ..
```

APK location: `android/app/build/outputs/apk/release/app-release.apk`

### Step 11: Testing on Real Device

#### Android:

1. Enable Developer Options on your Android device
2. Enable USB Debugging
3. Connect device via USB
4. In Android Studio: Run → Run 'app'

#### Or install APK directly:

```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### Step 12: Workflow for Updates

After making changes to your web app:

```bash
# 1. Build web app
npm run build

# 2. Sync to native projects
npx cap sync

# 3. Open in IDE and rebuild
npx cap open android
# or
npx cap open ios
```

### Step 13: Publishing to Google Play Store

1. Build release APK (see Step 10)
2. Go to [Google Play Console](https://play.google.com/console)
3. Create new app
4. Upload APK under **Production** → **Create new release**
5. Fill in store listing details
6. Submit for review

### Common Issues and Solutions

#### Issue: White screen on app launch
**Solution**: Check that `webDir` in capacitor.config.json points to `dist`

#### Issue: Firebase not working
**Solution**: Ensure Firebase config is correct and domain is whitelisted in Firebase Console

#### Issue: Network requests failing
**Solution**: Add `cleartext: true` in capacitor.config.json server settings

#### Issue: App crashing on Android
**Solution**: Check logcat in Android Studio for error messages

### Useful Commands

```bash
# Check Capacitor installation
npx cap doctor

# Update Capacitor
npm install @capacitor/cli@latest @capacitor/core@latest
npx cap sync

# Clean and rebuild
npx cap copy android
npx cap sync android

# List installed plugins
npx cap ls

# Remove platform
npx cap remove android
npx cap remove ios
```

### Development vs Production

**Development:**
- Use `npm run dev` for web development
- Use Android Studio for native testing
- Hot reload works in web, not in native

**Production:**
- Always run `npm run build` before syncing
- Test release APK before publishing
- Use ProGuard for code obfuscation

### File Structure After Capacitor

```
allinstock/
├── android/              # Android project
├── ios/                  # iOS project (if added)
├── dist/                 # Built web assets
├── src/                  # React source code
├── capacitor.config.json # Capacitor configuration
├── package.json
└── vite.config.js
```

### Performance Tips

1. **Optimize Images**: Use WebP format, compress images
2. **Code Splitting**: Already done with React.lazy
3. **Service Worker**: Add for offline support
4. **Native Splash**: Replace default with branded splash screen
5. **App Size**: Use APK Analyzer to reduce size

### Next Steps

- [ ] Install Capacitor and initialize project
- [ ] Add Android platform
- [ ] Build and test debug APK
- [ ] Install essential plugins (StatusBar, SplashScreen)
- [ ] Create app icon and splash screen
- [ ] Build release APK
- [ ] Test on real devices
- [ ] Publish to Google Play Store

## Additional Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Android Studio Download](https://developer.android.com/studio)
- [Xcode Download](https://developer.apple.com/xcode/)
- [Google Play Console](https://play.google.com/console)
- [Apple Developer](https://developer.apple.com/)
