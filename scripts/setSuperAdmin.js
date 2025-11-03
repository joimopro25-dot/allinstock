// Script to set a user as super admin
// Usage: node scripts/setSuperAdmin.js <user-email>

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Initialize the app
initializeApp({
  projectId: 'allinstock-ded6e'
});

const db = getFirestore();
const auth = getAuth();

async function setSuperAdmin(email) {
  try {
    console.log(`🔍 Looking for user with email: ${email}`);

    // Get user by email
    const userRecord = await auth.getUserByEmail(email);
    console.log(`✅ Found user: ${userRecord.uid}`);

    // Update user document in Firestore
    const userRef = db.collection('users').doc(userRecord.uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      console.log(`⚠️  User document doesn't exist in Firestore. Creating it...`);
      await userRef.set({
        email: email,
        role: 'super_admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } else {
      console.log(`📝 Updating existing user document...`);
      await userRef.update({
        role: 'super_admin',
        updatedAt: new Date().toISOString()
      });
    }

    console.log(`✅ Successfully set ${email} as super admin!`);
    console.log(`🎉 User ${userRecord.uid} now has super_admin role`);

    // Verify the update
    const updatedDoc = await userRef.get();
    console.log(`\n📋 User data:`, updatedDoc.data());

  } catch (error) {
    console.error(`❌ Error setting super admin:`, error);
    process.exit(1);
  }

  process.exit(0);
}

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.error('❌ Please provide an email address');
  console.log('Usage: node scripts/setSuperAdmin.js <user-email>');
  process.exit(1);
}

setSuperAdmin(email);
