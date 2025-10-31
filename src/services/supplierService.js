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

// Get all suppliers for a company
async function getSuppliers(companyId) {
  const suppliersRef = collection(db, 'companies', companyId, 'suppliers');
  const q = query(suppliersRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

// Get a single supplier
async function getSupplier(companyId, supplierId) {
  const supplierRef = doc(db, 'companies', companyId, 'suppliers', supplierId);
  const supplierDoc = await getDoc(supplierRef);

  if (!supplierDoc.exists()) {
    throw new Error('Supplier not found');
  }

  return {
    id: supplierDoc.id,
    ...supplierDoc.data()
  };
}

// Create a new supplier
async function createSupplier(companyId, supplierData) {
  const suppliersRef = collection(db, 'companies', companyId, 'suppliers');
  const newSupplier = {
    ...supplierData,
    status: supplierData.status || 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const docRef = await addDoc(suppliersRef, newSupplier);
  return docRef.id;
}

// Update a supplier
async function updateSupplier(companyId, supplierId, supplierData) {
  const supplierRef = doc(db, 'companies', companyId, 'suppliers', supplierId);

  await updateDoc(supplierRef, {
    ...supplierData,
    updatedAt: new Date().toISOString()
  });
}

// Delete a supplier
async function deleteSupplier(companyId, supplierId) {
  const supplierRef = doc(db, 'companies', companyId, 'suppliers', supplierId);
  await deleteDoc(supplierRef);
}

// Toggle supplier status (active/inactive)
async function toggleSupplierStatus(companyId, supplierId) {
  const supplierRef = doc(db, 'companies', companyId, 'suppliers', supplierId);
  const supplierDoc = await getDoc(supplierRef);

  if (!supplierDoc.exists()) {
    throw new Error('Supplier not found');
  }

  const currentStatus = supplierDoc.data().status;
  const newStatus = currentStatus === 'active' ? 'inactive' : 'active';

  await updateDoc(supplierRef, {
    status: newStatus,
    updatedAt: new Date().toISOString()
  });
}

// Search suppliers
async function searchSuppliers(companyId, searchTerm) {
  const suppliersRef = collection(db, 'companies', companyId, 'suppliers');
  const snapshot = await getDocs(suppliersRef);

  const searchLower = searchTerm.toLowerCase();

  return snapshot.docs
    .map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    .filter(supplier => {
      return (
        supplier.companyName?.toLowerCase().includes(searchLower) ||
        supplier.name?.toLowerCase().includes(searchLower) ||
        supplier.email?.toLowerCase().includes(searchLower) ||
        supplier.phone?.includes(searchTerm) ||
        supplier.taxId?.toLowerCase().includes(searchLower)
      );
    });
}

export const supplierService = {
  getSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  toggleSupplierStatus,
  searchSuppliers
};
