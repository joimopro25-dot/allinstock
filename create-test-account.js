/**
 * Script to create a test account for Google Play Store reviewers
 * Run with: node create-test-account.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const auth = admin.auth();
const db = admin.firestore();

const TEST_USER = {
  email: 'teste.revisor@allinstock.pt',
  password: 'AllInStockTest2025!',
  displayName: 'Conta de Teste - Revisor Google Play'
};

async function createTestAccount() {
  try {
    console.log('Creating test user in Firebase Authentication...');

    // Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email: TEST_USER.email,
      password: TEST_USER.password,
      displayName: TEST_USER.displayName,
      emailVerified: true
    });

    console.log('✓ Test user created successfully:', userRecord.uid);

    // Create user profile in Firestore
    await db.collection('users').doc(userRecord.uid).set({
      email: TEST_USER.email,
      displayName: TEST_USER.displayName,
      companyName: 'Empresa de Teste para Revisão',
      role: 'admin',
      planId: 'premium', // Give full access for testing
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      isTestAccount: true
    });

    console.log('✓ User profile created in Firestore');

    // Add some sample data for testing
    const companyData = {
      userId: userRecord.uid,
      name: 'Empresa de Teste',
      nif: '123456789',
      address: 'Rua de Teste, 123',
      city: 'Porto',
      postalCode: '4000-000',
      phone: '+351 912345678',
      email: TEST_USER.email,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('companies').add(companyData);
    console.log('✓ Sample company data created');

    console.log('\n========================================');
    console.log('TEST ACCOUNT CREDENTIALS:');
    console.log('========================================');
    console.log('Email:', TEST_USER.email);
    console.log('Password:', TEST_USER.password);
    console.log('========================================');
    console.log('\nUse these credentials in the Play Store test access form.');

  } catch (error) {
    if (error.code === 'auth/email-already-exists') {
      console.log('\n⚠ Test account already exists');
      console.log('\n========================================');
      console.log('TEST ACCOUNT CREDENTIALS:');
      console.log('========================================');
      console.log('Email:', TEST_USER.email);
      console.log('Password:', TEST_USER.password);
      console.log('========================================');
    } else {
      console.error('Error creating test account:', error);
    }
  } finally {
    process.exit(0);
  }
}

createTestAccount();
