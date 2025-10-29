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

// Get all products for a company
async function getProducts(companyId) {
  const productsRef = collection(db, 'companies', companyId, 'products');
  const q = query(productsRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  
  const products = [];
  for (const docSnap of snapshot.docs) {
    const productData = { id: docSnap.id, ...docSnap.data() };
    
    // Get stock locations and calculate total
    const locations = await getStockLocations(companyId, docSnap.id);
    productData.stockLocations = locations;
    productData.totalStock = locations.reduce((sum, loc) => sum + loc.quantity, 0);
    
    products.push(productData);
  }
  
  return products;
}

// Get single product
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

// Create product
async function createProduct(companyId, productData) {
  const productsRef = collection(db, 'companies', companyId, 'products');
  const newProduct = {
    ...productData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  const docRef = await addDoc(productsRef, newProduct);
  
  // Create main warehouse location if initial stock provided
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

// Update product
async function updateProduct(companyId, productId, productData) {
  const productRef = doc(db, 'companies', companyId, 'products', productId);
  await updateDoc(productRef, {
    ...productData,
    updatedAt: new Date().toISOString()
  });
}

// Delete product
async function deleteProduct(companyId, productId) {
  // Delete all stock locations first
  const locations = await getStockLocations(companyId, productId);
  for (const location of locations) {
    await deleteStockLocation(companyId, productId, location.id);
  }
  
  // Delete product
  const productRef = doc(db, 'companies', companyId, 'products', productId);
  await deleteDoc(productRef);
}

// Get stock locations for a product
async function getStockLocations(companyId, productId) {
  const locationsRef = collection(db, 'companies', companyId, 'products', productId, 'stockLocations');
  const snapshot = await getDocs(locationsRef);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

// Add stock location
async function addStockLocation(companyId, productId, locationData) {
  const locationsRef = collection(db, 'companies', companyId, 'products', productId, 'stockLocations');
  const newLocation = {
    ...locationData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  return await addDoc(locationsRef, newLocation);
}

// Update stock location
async function updateStockLocation(companyId, productId, locationId, locationData) {
  const locationRef = doc(db, 'companies', companyId, 'products', productId, 'stockLocations', locationId);
  await updateDoc(locationRef, {
    ...locationData,
    updatedAt: new Date().toISOString()
  });
}

// Delete stock location
async function deleteStockLocation(companyId, productId, locationId) {
  const locationRef = doc(db, 'companies', companyId, 'products', productId, 'stockLocations', locationId);
  await deleteDoc(locationRef);
}

// Export all functions as named exports
export const productService = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getStockLocations,
  addStockLocation,
  updateStockLocation,
  deleteStockLocation
};