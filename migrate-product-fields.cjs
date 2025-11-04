/**
 * Migration script to extract existing Family, Type, and Category values
 * from products and create collections for dropdowns
 *
 * Run with: node migrate-product-fields.js
 */

const admin = require('firebase-admin');

// Initialize without service account - will use application default credentials
try {
  admin.initializeApp({
    projectId: 'allinstock-ded6e'
  });
} catch (error) {
  console.log('Firebase already initialized');
}

const db = admin.firestore();

async function migrateProductFields() {
  try {
    console.log('Starting migration of product fields...\n');

    // Get all companies
    const companiesSnapshot = await db.collection('companies').get();

    for (const companyDoc of companiesSnapshot.docs) {
      const companyId = companyDoc.id;
      const companyName = companyDoc.data().name || 'Unknown';

      console.log(`\n📦 Processing company: ${companyName} (${companyId})`);

      // Get all products for this company
      const productsSnapshot = await db
        .collection('companies')
        .doc(companyId)
        .collection('products')
        .get();

      if (productsSnapshot.empty) {
        console.log('  ⚠ No products found, skipping...');
        continue;
      }

      // Collect unique values
      const families = new Set();
      const types = new Set();
      const categories = new Set();

      productsSnapshot.docs.forEach(doc => {
        const product = doc.data();
        if (product.family && product.family.trim()) {
          families.add(product.family.trim());
        }
        if (product.type && product.type.trim()) {
          types.add(product.type.trim());
        }
        if (product.category && product.category.trim()) {
          categories.add(product.category.trim());
        }
      });

      console.log(`  Found ${productsSnapshot.docs.length} products`);
      console.log(`  Unique Families: ${families.size}`);
      console.log(`  Unique Types: ${types.size}`);
      console.log(`  Unique Categories: ${categories.size}`);

      // Create or update productFamilies collection
      if (families.size > 0) {
        console.log('\n  Creating families...');
        for (const family of families) {
          const familyRef = db
            .collection('companies')
            .doc(companyId)
            .collection('productFamilies')
            .doc();

          await familyRef.set({
            name: family,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          console.log(`    ✓ ${family}`);
        }
      }

      // Create or update productTypes collection
      if (types.size > 0) {
        console.log('\n  Creating types...');
        for (const type of types) {
          const typeRef = db
            .collection('companies')
            .doc(companyId)
            .collection('productTypes')
            .doc();

          await typeRef.set({
            name: type,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          console.log(`    ✓ ${type}`);
        }
      }

      // Create or update productCategories collection
      if (categories.size > 0) {
        console.log('\n  Creating categories...');
        for (const category of categories) {
          const categoryRef = db
            .collection('companies')
            .doc(companyId)
            .collection('productCategories')
            .doc();

          await categoryRef.set({
            name: category,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          console.log(`    ✓ ${category}`);
        }
      }

      console.log(`\n  ✅ Migration complete for ${companyName}`);
    }

    console.log('\n\n🎉 Migration completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Refresh your browser');
    console.log('2. Open Add Product modal');
    console.log('3. You should now see dropdowns with your existing values');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('\nError details:', error.message);

    if (error.message && (error.message.includes('PERMISSION_DENIED') || error.message.includes('credentials') || error.message.includes('Could not load'))) {
      console.log('\n⚠ Authentication issue detected!');
      console.log('\nTo fix this, you need to download a service account key:');
      console.log('1. Go to: https://console.firebase.google.com/project/allinstock-ded6e/settings/serviceaccounts/adminsdk');
      console.log('2. Click "Generate new private key"');
      console.log('3. Save the file as "serviceAccountKey.json" in the project root');
      console.log('4. Run the script again');
    }
  } finally {
    process.exit(0);
  }
}

migrateProductFields();
