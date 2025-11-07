import { db } from '../config/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where
} from 'firebase/firestore';

// Get all supplier prices for a product
async function getSupplierPrices(companyId, productId) {
  const pricesRef = collection(db, 'companies', companyId, 'products', productId, 'supplierPrices');
  const q = query(pricesRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

// Get a single supplier price record
async function getSupplierPrice(companyId, productId, priceId) {
  const priceRef = doc(db, 'companies', companyId, 'products', productId, 'supplierPrices', priceId);
  const priceDoc = await getDoc(priceRef);

  if (!priceDoc.exists()) {
    throw new Error('Supplier price not found');
  }

  return {
    id: priceDoc.id,
    ...priceDoc.data()
  };
}

// Create a new supplier price record
async function createSupplierPrice(companyId, productId, priceData) {
  const pricesRef = collection(db, 'companies', companyId, 'products', productId, 'supplierPrices');
  const now = new Date().toISOString();

  const newPrice = {
    ...priceData,
    lastPurchaseDate: priceData.lastPurchaseDate || null,
    lastPurchasePrice: priceData.lastPurchasePrice || null,
    priceHistory: priceData.priceHistory || [],
    createdAt: now,
    updatedAt: now
  };

  const docRef = await addDoc(pricesRef, newPrice);
  return docRef.id;
}

// Update a supplier price record
async function updateSupplierPrice(companyId, productId, priceId, priceData) {
  const priceRef = doc(db, 'companies', companyId, 'products', productId, 'supplierPrices', priceId);

  await updateDoc(priceRef, {
    ...priceData,
    updatedAt: new Date().toISOString()
  });
}

// Delete a supplier price record
async function deleteSupplierPrice(companyId, productId, priceId) {
  const priceRef = doc(db, 'companies', companyId, 'products', productId, 'supplierPrices', priceId);
  await deleteDoc(priceRef);
}

// Get all products for a specific supplier
async function getProductsBySupplier(companyId, supplierId) {
  const productsRef = collection(db, 'companies', companyId, 'products');
  const productsSnapshot = await getDocs(productsRef);

  const productsWithPrices = [];

  for (const productDoc of productsSnapshot.docs) {
    const pricesRef = collection(db, 'companies', companyId, 'products', productDoc.id, 'supplierPrices');
    const q = query(pricesRef, where('supplierId', '==', supplierId));
    const pricesSnapshot = await getDocs(q);

    if (!pricesSnapshot.empty) {
      productsWithPrices.push({
        id: productDoc.id,
        ...productDoc.data(),
        supplierPrices: pricesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
      });
    }
  }

  return productsWithPrices;
}

// Set a supplier as preferred for a product
async function setPreferredSupplier(companyId, productId, priceId) {
  // First, unset all other preferred flags for this product
  const pricesRef = collection(db, 'companies', companyId, 'products', productId, 'supplierPrices');
  const snapshot = await getDocs(pricesRef);

  const updatePromises = snapshot.docs.map(doc =>
    updateDoc(doc.ref, { isPreferred: doc.id === priceId })
  );

  await Promise.all(updatePromises);
}

// Update price from purchase order (adds to history)
async function updatePriceFromPurchaseOrder(companyId, productId, supplierId, purchaseOrderData) {
  const { purchasePrice, purchaseOrderId, purchaseOrderDate } = purchaseOrderData;

  // Find the supplier price record for this supplier
  const pricesRef = collection(db, 'companies', companyId, 'products', productId, 'supplierPrices');
  const q = query(pricesRef, where('supplierId', '==', supplierId));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    // No supplier price record exists, create one
    await createSupplierPrice(companyId, productId, {
      supplierId,
      purchasePrice,
      lastPurchaseDate: purchaseOrderDate,
      lastPurchasePrice: purchasePrice,
      priceHistory: [{
        price: purchasePrice,
        date: purchaseOrderDate,
        purchaseOrderId
      }],
      currency: 'EUR'
    });
    return { isNew: true };
  }

  // Update existing record
  const priceDoc = snapshot.docs[0];
  const currentData = priceDoc.data();
  const oldPrice = currentData.purchasePrice;

  // Add to price history
  const priceHistory = currentData.priceHistory || [];
  priceHistory.push({
    price: purchasePrice,
    date: purchaseOrderDate,
    purchaseOrderId,
    oldPrice
  });

  await updateDoc(priceDoc.ref, {
    lastPurchaseDate: purchaseOrderDate,
    lastPurchasePrice: purchasePrice,
    priceHistory,
    updatedAt: new Date().toISOString()
  });

  // Return info about price change
  return {
    isNew: false,
    priceChanged: oldPrice !== purchasePrice,
    oldPrice,
    newPrice: purchasePrice
  };
}

// Get supplier price by supplierId (not price record ID)
async function getSupplierPriceBySupplierId(companyId, productId, supplierId) {
  const pricesRef = collection(db, 'companies', companyId, 'products', productId, 'supplierPrices');
  const q = query(pricesRef, where('supplierId', '==', supplierId));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return null;
  }

  return {
    id: snapshot.docs[0].id,
    ...snapshot.docs[0].data()
  };
}

export const supplierPriceService = {
  getSupplierPrices,
  getSupplierPrice,
  createSupplierPrice,
  updateSupplierPrice,
  deleteSupplierPrice,
  getProductsBySupplier,
  setPreferredSupplier,
  updatePriceFromPurchaseOrder,
  getSupplierPriceBySupplierId
};
