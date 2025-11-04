const fs = require('fs');
const path = require('path');

console.log('\n🔍 Checking Firebase Android Configuration...\n');

// Check if google-services.json exists
const googleServicesPath = path.join(__dirname, 'android', 'app', 'google-services.json');
const exists = fs.existsSync(googleServicesPath);

if (exists) {
  console.log('✅ google-services.json found!');
  console.log(`   Location: ${googleServicesPath}\n`);

  // Read and validate the file
  try {
    const content = fs.readFileSync(googleServicesPath, 'utf8');
    const json = JSON.parse(content);

    console.log('📋 Firebase Configuration Details:');
    console.log(`   Project ID: ${json.project_info?.project_id || 'Not found'}`);
    console.log(`   Project Number: ${json.project_info?.project_number || 'Not found'}`);

    if (json.client && json.client.length > 0) {
      const androidClient = json.client.find(c =>
        c.client_info?.android_client_info?.package_name === 'pt.allinstock.crm'
      );

      if (androidClient) {
        console.log(`   ✅ Android package configured: pt.allinstock.crm`);
        console.log(`   App ID: ${androidClient.client_info?.mobilesdk_app_id || 'Not found'}`);
      } else {
        console.log(`   ⚠️  Package 'pt.allinstock.crm' not found in configuration`);
        console.log(`   Available packages: ${json.client.map(c => c.client_info?.android_client_info?.package_name).join(', ')}`);
      }
    }

    console.log('\n✅ Your Android app is configured for Firebase!\n');
    console.log('Next steps:');
    console.log('1. Build your Android app: npm run android:build');
    console.log('2. Open in Android Studio: npm run android:open');
    console.log('3. Run on device/emulator\n');

  } catch (error) {
    console.log('❌ Error reading google-services.json:', error.message);
    console.log('   The file may be corrupted. Please download it again from Firebase Console.\n');
  }

} else {
  console.log('❌ google-services.json NOT FOUND\n');
  console.log('📝 To add Firebase to your Android app:\n');
  console.log('1. Go to Firebase Console: https://console.firebase.google.com/');
  console.log('2. Select your project: allinstock-ded6e');
  console.log('3. Click the gear icon (⚙️) → Project settings');
  console.log('4. Scroll down to "Your apps" section');
  console.log('5. Look for an Android app or click "Add app" → Android');
  console.log('6. Register with package name: pt.allinstock.crm');
  console.log('7. Download google-services.json');
  console.log(`8. Place it here: ${googleServicesPath}\n`);
  console.log('9. Run this script again to verify: node check-firebase-android.js\n');
}

// Check Android build.gradle
const buildGradlePath = path.join(__dirname, 'android', 'app', 'build.gradle');
if (fs.existsSync(buildGradlePath)) {
  const buildGradle = fs.readFileSync(buildGradlePath, 'utf8');

  if (buildGradle.includes('com.google.gms:google-services')) {
    console.log('✅ Google Services plugin is configured in build.gradle');
  } else {
    console.log('⚠️  Google Services plugin may need to be added to build.gradle');
    console.log('   This will be added automatically when you sync after adding google-services.json\n');
  }
}
