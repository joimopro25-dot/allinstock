import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  query,
  orderBy 
} from 'firebase/firestore';
import { db } from '../config/firebase';

async function getProducts(companyId) {
  const productsRef = collection(db, 'companies', companyId, 'products');
  const q = query(productsRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  
  const products = [];
  for (const docSnap of snapshot.docs) {
    const productData = { id: docSnap.id, ...docSnap.data() };
    
    const locations = await getStockLocations(companyId, docSnap.id);
    productData.stockLocations = locations;
    productData.totalStock = locations.reduce((sum, loc) => sum + loc.quantity, 0);
    
    products.push(productData);
  }
  
  return products;
}

async function getProduct(companyId, productId) {
  const productRef = doc(db, 'companies', companyId, 'products', productId);
  const docSnap = await getDoc(productRef);
  
  if (docSnap.exists()) {
    const productData = { id: docSnap.id, ...docSnap.data() };
    const locations = await getStockLocations(companyId, productId);
    productData.stockLocations = locations;
    productData.totalStock = locations.reduce((sum, loc) => sum + loc.quantity, 0);
    return productData;
  }
  
  return null;
}

async function createProduct(companyId, productData) {
  const productsRef = collection(db, 'companies', companyId, 'products');
  const newProduct = {
    ...productData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  const docRef = await addDoc(productsRef, newProduct);
  
  if (productData.initialStock && productData.initialStock > 0) {
    await addStockLocation(companyId, docRef.id, {
      name: 'Armazém Principal',
      type: 'warehouse',
      quantity: productData.initialStock,
      isMain: true
    });
  }
  
  return docRef.id;
}

async function updateProduct(companyId, productId, productData) {
  const productRef = doc(db, 'companies', companyId, 'products', productId);
  await updateDoc(productRef, {
    ...productData,
    updatedAt: new Date().toISOString()
  });
}

async function deleteProduct(companyId, productId) {
  const locations = await getStockLocations(companyId, productId);
  for (const location of locations) {
    await deleteStockLocation(companyId, productId, location.id);
  }
  
  const productRef = doc(db, 'companies', companyId, 'products', productId);
  await deleteDoc(productRef);
}

async function getStockLocations(companyId, productId) {
  const locationsRef = collection(db, 'companies', companyId, 'products', productId, 'stockLocations');
  const snapshot = await getDocs(locationsRef);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

async function addStockLocation(companyId, productId, locationData, userEmail = null) {
  const locationsRef = collection(db, 'companies', companyId, 'products', productId, 'stockLocations');
  const newLocation = {
    ...locationData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const docRef = await addDoc(locationsRef, newLocation);

  // Record movement if quantity > 0
  if (locationData.quantity && locationData.quantity > 0) {
    await addStockMovement(companyId, productId, {
      type: 'entry',
      quantity: locationData.quantity,
      locationId: docRef.id,
      locationName: locationData.name,
      user: userEmail,
      notes: locationData.isMain ? 'Initial stock - Main warehouse' : 'New location created'
    });
  }

  return docRef;
}

async function updateStockLocation(companyId, productId, locationId, locationData, userEmail = null) {
  const locationRef = doc(db, 'companies', companyId, 'products', productId, 'stockLocations', locationId);

  // Get old quantity to calculate difference
  const oldDoc = await getDoc(locationRef);
  const oldQuantity = oldDoc.exists() ? (oldDoc.data().quantity || 0) : 0;
  const newQuantity = locationData.quantity || 0;
  const difference = newQuantity - oldQuantity;

  await updateDoc(locationRef, {
    ...locationData,
    updatedAt: new Date().toISOString()
  });

  // Record movement if quantity changed
  if (difference !== 0) {
    await addStockMovement(companyId, productId, {
      type: difference > 0 ? 'entry' : 'exit',
      quantity: Math.abs(difference),
      locationId: locationId,
      locationName: locationData.name,
      user: userEmail,
      notes: 'Stock adjustment'
    });
  }
}

async function deleteStockLocation(companyId, productId, locationId, userEmail = null) {
  const locationRef = doc(db, 'companies', companyId, 'products', productId, 'stockLocations', locationId);

  // Get location data before deleting
  const locationDoc = await getDoc(locationRef);
  if (locationDoc.exists()) {
    const locationData = locationDoc.data();

    // Record exit movement if there was stock
    if (locationData.quantity && locationData.quantity > 0) {
      await addStockMovement(companyId, productId, {
        type: 'exit',
        quantity: locationData.quantity,
        locationId: locationId,
        locationName: locationData.name,
        user: userEmail,
        notes: 'Location deleted'
      });
    }
  }

  await deleteDoc(locationRef);
}

// Stock Movements Functions
async function getStockMovements(companyId, productId, limit = 50) {
  const movementsRef = collection(db, 'companies', companyId, 'products', productId, 'movements');
  const q = query(movementsRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.slice(0, limit).map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

async function addStockMovement(companyId, productId, movementData) {
  const movementsRef = collection(db, 'companies', companyId, 'products', productId, 'movements');
  const newMovement = {
    ...movementData,
    createdAt: new Date().toISOString()
  };

  return await addDoc(movementsRef, newMovement);
}

async function transferStock(companyId, productId, transferData, userEmail = null) {
  const { fromLocationId, toLocationId, quantity, notes } = transferData;

  // Get both locations
  const fromLocationRef = doc(db, 'companies', companyId, 'products', productId, 'stockLocations', fromLocationId);
  const toLocationRef = doc(db, 'companies', companyId, 'products', productId, 'stockLocations', toLocationId);

  const [fromDoc, toDoc] = await Promise.all([
    getDoc(fromLocationRef),
    getDoc(toLocationRef)
  ]);

  if (!fromDoc.exists() || !toDoc.exists()) {
    throw new Error('Location not found');
  }

  const fromLocation = fromDoc.data();
  const toLocation = toDoc.data();

  if (fromLocation.quantity < quantity) {
    throw new Error('Insufficient stock in source location');
  }

  // Update quantities
  await Promise.all([
    updateDoc(fromLocationRef, {
      quantity: fromLocation.quantity - quantity,
      updatedAt: new Date().toISOString()
    }),
    updateDoc(toLocationRef, {
      quantity: (toLocation.quantity || 0) + quantity,
      updatedAt: new Date().toISOString()
    })
  ]);

  // Record transfer movement
  await addStockMovement(companyId, productId, {
    type: 'transfer',
    quantity: quantity,
    fromLocationId: fromLocationId,
    fromLocationName: fromLocation.name,
    toLocationId: toLocationId,
    toLocationName: toLocation.name,
    user: userEmail,
    notes: notes || 'Stock transfer'
  });
}

export const productService = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getStockLocations,
  addStockLocation,
  updateStockLocation,
  deleteStockLocation,
  getStockMovements,
  addStockMovement,
  transferStock
};