/**
 * Client-side migration utility to extract existing Family, Type, and Category values
 * from products and create collections for dropdowns
 */

import { collection, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

export async function migrateProductFields(companyId) {
  try {
    console.log('Starting migration of product fields...');

    // Get all products for this company
    const productsSnapshot = await getDocs(
      collection(db, 'companies', companyId, 'products')
    );

    if (productsSnapshot.empty) {
      console.log('No products found');
      return {
        success: true,
        message: 'No products found to migrate'
      };
    }

    // Collect unique values
    const families = new Set();
    const types = new Set();
    const categories = new Set();

    productsSnapshot.docs.forEach(docSnap => {
      const product = docSnap.data();
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

    console.log(`Found ${productsSnapshot.docs.length} products`);
    console.log(`Unique Families: ${families.size}`);
    console.log(`Unique Types: ${types.size}`);
    console.log(`Unique Categories: ${categories.size}`);

    let created = {
      families: 0,
      types: 0,
      categories: 0
    };

    // Create productFamilies collection
    if (families.size > 0) {
      console.log('Creating families...');
      for (const family of families) {
        const familyRef = doc(collection(db, 'companies', companyId, 'productFamilies'));
        await setDoc(familyRef, {
          name: family,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        created.families++;
        console.log(`✓ ${family}`);
      }
    }

    // Create productTypes collection
    if (types.size > 0) {
      console.log('Creating types...');
      for (const type of types) {
        const typeRef = doc(collection(db, 'companies', companyId, 'productTypes'));
        await setDoc(typeRef, {
          name: type,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        created.types++;
        console.log(`✓ ${type}`);
      }
    }

    // Create productCategories collection
    if (categories.size > 0) {
      console.log('Creating categories...');
      for (const category of categories) {
        const categoryRef = doc(collection(db, 'companies', companyId, 'productCategories'));
        await setDoc(categoryRef, {
          name: category,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        created.categories++;
        console.log(`✓ ${category}`);
      }
    }

    console.log('Migration completed successfully!');

    return {
      success: true,
      message: `Migration complete! Created ${created.families} families, ${created.types} types, and ${created.categories} categories.`,
      created
    };

  } catch (error) {
    console.error('Migration failed:', error);
    return {
      success: false,
      message: `Migration failed: ${error.message}`,
      error
    };
  }
}
