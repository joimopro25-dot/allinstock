# AllInStock - Capacitor Android Setup Guide

## Overview
Your AllInStock CRM app is now configured with Capacitor and ready to be built for Android!

## Prerequisites
- **Android Studio** (latest version recommended)
- **Java JDK** 17 or higher
- **Android SDK** (API 33 or higher)
- **Gradle** (comes with Android Studio)

## Project Structure
```
allinstock/
├── android/              # Native Android project
├── dist/                 # Web build output
├── capacitor.config.ts   # Capacitor configuration
└── src/                  # React source code
```

## Available Scripts

### Development
```bash
# Run web version
npm run dev

# Build web version
npm run build
```

### Android
```bash
# Build web and sync to Android
npm run android:build

# Open project in Android Studio
npm run android:open

# Build and run on device/emulator
npm run android:run

# Sync changes to Android
npm run android:sync

# Sync all platforms
npm run cap:sync

# Update Capacitor
npm run cap:update
```

## How to Open in Android Studio

### Method 1: Using npm script (Recommended)
```bash
npm run android:open
```

### Method 2: Manually
1. Open Android Studio
2. Click "Open an Existing Project"
3. Navigate to `D:\allinstock\android`
4. Click "OK"

## Building for Android

### First Time Setup in Android Studio
1. Open the project in Android Studio (`npm run android:open`)
2. Wait for Gradle sync to complete (this may take a few minutes)
3. Android Studio will download necessary SDK components
4. Once sync is complete, you're ready to build!

### Running on Emulator
1. In Android Studio, click "AVD Manager" (phone icon in toolbar)
2. Create a new virtual device (if you don't have one)
3. Click the "Run" button (green play icon)
4. Select your emulator from the device list

### Running on Physical Device
1. Enable Developer Options on your Android device:
   - Go to Settings → About Phone
   - Tap "Build Number" 7 times
2. Enable USB Debugging:
   - Go to Settings → Developer Options
   - Enable "USB Debugging"
3. Connect your device via USB
4. Click "Run" in Android Studio
5. Select your device from the list

### Building APK
1. In Android Studio: Build → Build Bundle(s) / APK(s) → Build APK(s)
2. APK will be created in: `android/app/build/outputs/apk/debug/app-debug.apk`

### Building Release APK (for Google Play)
1. Create a keystore (one-time):
   ```bash
   keytool -genkey -v -keystore my-release-key.keystore -keyalg RSA -keysize 2048 -validity 10000 -alias my-key-alias
   ```
2. Configure signing in Android Studio:
   - Build → Generate Signed Bundle / APK
   - Select APK → Next
   - Choose keystore file → Enter passwords
   - Select "release" build variant
   - Click Finish

## Making Changes to the App

### Web Changes (React Code)
1. Edit files in `src/`
2. Run build and sync:
   ```bash
   npm run android:build
   ```
3. In Android Studio, click "Run" to see changes

### Android-Specific Changes
1. Open project in Android Studio
2. Edit Android files in `android/` directory
3. Run/rebuild from Android Studio

### Adding Capacitor Plugins
```bash
# Example: Adding camera plugin
npm install @capacitor/camera
npx cap sync android
```

## Installed Capacitor Plugins

- **@capacitor/app** - App lifecycle events
- **@capacitor/splash-screen** - Custom splash screen
- **@capacitor/status-bar** - Status bar styling
- **@capacitor/keyboard** - Keyboard management

## Configuration

### App Details
- **App Name**: AllInStock
- **Package ID**: pt.allinstock.crm
- **Splash Screen**: Configured with dark background (#1a1a3e)
- **Status Bar**: Dark style to match app theme

### Permissions Configured
- Internet access
- Network state
- Camera (for future features)
- File storage (images/documents)

## Troubleshooting

### Gradle Sync Failed
- Make sure you have Java JDK 17+ installed
- File → Invalidate Caches → Invalidate and Restart

### Plugin Errors
```bash
# Resync plugins
npm run cap:sync
```

### Changes Not Showing
```bash
# Clean and rebuild
npm run android:build
```

### Android Studio Can't Find SDK
- Open Android Studio → Preferences/Settings
- Appearance & Behavior → System Settings → Android SDK
- Install missing components

## Firebase Configuration (Important!)

For Firebase to work in the Android app, you'll need to:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (allinstock-ded6e)
3. Add Android app:
   - Package name: `pt.allinstock.crm`
   - Download `google-services.json`
   - Place it in `android/app/` directory
4. Sync and rebuild

## Next Steps

1. **Open in Android Studio**:
   ```bash
   npm run android:open
   ```

2. **Wait for Gradle sync** (first time may take 5-10 minutes)

3. **Run on emulator or device** using the green play button

4. **Test your app** on Android!

## Resources

- [Capacitor Docs](https://capacitorjs.com/docs)
- [Android Developer Guide](https://developer.android.com/guide)
- [Firebase Android Setup](https://firebase.google.com/docs/android/setup)

## Support

For issues or questions:
- Check the Capacitor documentation
- Review Android Studio error logs
- Consult the Firebase console for configuration issues

---

**Ready to go!** Your AllInStock CRM is now fully configured for Android development.
