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

// Generate quotation number
async function generateQuotationNumber(companyId) {
  const year = new Date().getFullYear();
  const quotationsRef = collection(db, 'companies', companyId, 'quotations');
  const q = query(
    quotationsRef,
    where('quotationNumber', '>=', `Q-${year}-`),
    where('quotationNumber', '<', `Q-${year + 1}-`),
    orderBy('quotationNumber', 'desc')
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return `Q-${year}-001`;
  }

  const lastNumber = snapshot.docs[0].data().quotationNumber;
  const lastSequence = parseInt(lastNumber.split('-')[2]);
  const newSequence = (lastSequence + 1).toString().padStart(3, '0');

  return `Q-${year}-${newSequence}`;
}

// Get all quotations for a company
async function getQuotations(companyId) {
  const quotationsRef = collection(db, 'companies', companyId, 'quotations');
  const q = query(quotationsRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

// Get a single quotation
async function getQuotation(companyId, quotationId) {
  const quotationRef = doc(db, 'companies', companyId, 'quotations', quotationId);
  const quotationDoc = await getDoc(quotationRef);

  if (!quotationDoc.exists()) {
    throw new Error('Quotation not found');
  }

  return {
    id: quotationDoc.id,
    ...quotationDoc.data()
  };
}

// Create a new quotation
async function createQuotation(companyId, quotationData, userEmail = null) {
  const quotationsRef = collection(db, 'companies', companyId, 'quotations');

  // Generate quotation number
  const quotationNumber = await generateQuotationNumber(companyId);

  // Calculate totals
  const items = quotationData.items || [];
  const subtotal = items.reduce((sum, item) => {
    const itemSubtotal = item.quantity * item.unitPrice * (1 - (item.discount || 0) / 100);
    return sum + itemSubtotal;
  }, 0);

  const taxRate = quotationData.taxRate || 23;
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  const newQuotation = {
    quotationNumber,
    clientId: quotationData.clientId,
    clientName: quotationData.clientName,
    clientEmail: quotationData.clientEmail || '',
    items: items.map(item => ({
      productId: item.productId,
      productName: item.productName,
      productReference: item.productReference || '',
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: item.discount || 0,
      subtotal: item.quantity * item.unitPrice * (1 - (item.discount || 0) / 100)
    })),
    subtotal,
    taxRate,
    taxAmount,
    total,
    validUntil: quotationData.validUntil || '',
    notes: quotationData.notes || '',
    status: quotationData.status || 'draft',
    createdBy: userEmail,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const docRef = await addDoc(quotationsRef, newQuotation);
  return { id: docRef.id, ...newQuotation };
}

// Update a quotation
async function updateQuotation(companyId, quotationId, quotationData) {
  const quotationRef = doc(db, 'companies', companyId, 'quotations', quotationId);

  // Recalculate totals if items are provided
  let updateData = { ...quotationData };

  if (quotationData.items) {
    const items = quotationData.items;
    const subtotal = items.reduce((sum, item) => {
      const itemSubtotal = item.quantity * item.unitPrice * (1 - (item.discount || 0) / 100);
      return sum + itemSubtotal;
    }, 0);

    const taxRate = quotationData.taxRate || 23;
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;

    updateData = {
      ...updateData,
      items: items.map(item => ({
        productId: item.productId,
        productName: item.productName,
        productReference: item.productReference || '',
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount || 0,
        subtotal: item.quantity * item.unitPrice * (1 - (item.discount || 0) / 100)
      })),
      subtotal,
      taxAmount,
      total
    };
  }

  await updateDoc(quotationRef, {
    ...updateData,
    updatedAt: new Date().toISOString()
  });
}

// Delete a quotation
async function deleteQuotation(companyId, quotationId) {
  const quotationRef = doc(db, 'companies', companyId, 'quotations', quotationId);
  await deleteDoc(quotationRef);
}

// Update quotation status
async function updateQuotationStatus(companyId, quotationId, status) {
  const quotationRef = doc(db, 'companies', companyId, 'quotations', quotationId);
  await updateDoc(quotationRef, {
    status,
    updatedAt: new Date().toISOString()
  });
}

// Get quotations by client
async function getQuotationsByClient(companyId, clientId) {
  const quotationsRef = collection(db, 'companies', companyId, 'quotations');
  const q = query(
    quotationsRef,
    where('clientId', '==', clientId),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

// Get quotations by status
async function getQuotationsByStatus(companyId, status) {
  const quotationsRef = collection(db, 'companies', companyId, 'quotations');
  const q = query(
    quotationsRef,
    where('status', '==', status),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

// Search quotations
async function searchQuotations(companyId, searchTerm) {
  const quotationsRef = collection(db, 'companies', companyId, 'quotations');
  const snapshot = await getDocs(quotationsRef);

  const searchLower = searchTerm.toLowerCase();

  return snapshot.docs
    .map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    .filter(quotation => {
      return (
        quotation.quotationNumber?.toLowerCase().includes(searchLower) ||
        quotation.clientName?.toLowerCase().includes(searchLower) ||
        quotation.clientEmail?.toLowerCase().includes(searchLower)
      );
    });
}

export const quotationService = {
  generateQuotationNumber,
  getQuotations,
  getQuotation,
  createQuotation,
  updateQuotation,
  deleteQuotation,
  updateQuotationStatus,
  getQuotationsByClient,
  getQuotationsByStatus,
  searchQuotations
};
