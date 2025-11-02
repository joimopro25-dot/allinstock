import { collection, getDocs, getDoc, doc, addDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';

export const invoiceService = {
  async getInvoices(companyId) {
    const invoicesRef = collection(db, 'companies', companyId, 'invoices');
    const snapshot = await getDocs(invoicesRef);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  },

  async getInvoice(companyId, invoiceId) {
    const invoiceRef = doc(db, 'companies', companyId, 'invoices', invoiceId);
    const invoiceDoc = await getDoc(invoiceRef);

    if (!invoiceDoc.exists()) {
      throw new Error('Invoice not found');
    }

    return {
      id: invoiceDoc.id,
      ...invoiceDoc.data()
    };
  },

  async createInvoice(companyId, invoiceData) {
    const invoicesRef = collection(db, 'companies', companyId, 'invoices');
    const docRef = await addDoc(invoicesRef, {
      ...invoiceData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return docRef.id;
  },

  async updateInvoice(companyId, invoiceId, invoiceData) {
    const invoiceRef = doc(db, 'companies', companyId, 'invoices', invoiceId);
    await updateDoc(invoiceRef, {
      ...invoiceData,
      updatedAt: new Date().toISOString()
    });
  },

  async deleteInvoice(companyId, invoiceId) {
    const invoiceRef = doc(db, 'companies', companyId, 'invoices', invoiceId);
    await deleteDoc(invoiceRef);
  },

  async updateInvoiceStatus(companyId, invoiceId, status) {
    const invoiceRef = doc(db, 'companies', companyId, 'invoices', invoiceId);
    await updateDoc(invoiceRef, {
      status,
      updatedAt: new Date().toISOString()
    });
  },

  async createInvoiceFromQuotation(companyId, quotationId, quotationData) {
    const invoicesRef = collection(db, 'companies', companyId, 'invoices');

    // Generate invoice number
    const invoicesSnapshot = await getDocs(invoicesRef);
    const invoiceNumber = `INV-${String(invoicesSnapshot.size + 1).padStart(5, '0')}`;

    const invoiceData = {
      invoiceNumber,
      quotationId,
      clientId: quotationData.clientId,
      clientName: quotationData.clientName,
      clientEmail: quotationData.clientEmail,
      clientPhone: quotationData.clientPhone,
      clientAddress: quotationData.clientAddress,
      date: new Date().toISOString().split('T')[0],
      dueDate: quotationData.dueDate || '',
      items: quotationData.items,
      subtotal: quotationData.subtotal,
      tax: quotationData.tax,
      discount: quotationData.discount || 0,
      total: quotationData.total,
      notes: quotationData.notes || '',
      status: 'pending',
      paymentStatus: 'unpaid',
      paymentMethod: '',
      paidAmount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const docRef = await addDoc(invoicesRef, invoiceData);
    return docRef.id;
  },

  async recordPayment(companyId, invoiceId, paymentAmount, paymentMethod, paymentDate) {
    const invoiceRef = doc(db, 'companies', companyId, 'invoices', invoiceId);
    const invoiceDoc = await getDoc(invoiceRef);

    if (!invoiceDoc.exists()) {
      throw new Error('Invoice not found');
    }

    const invoice = invoiceDoc.data();
    const newPaidAmount = (invoice.paidAmount || 0) + paymentAmount;
    const newPaymentStatus = newPaidAmount >= invoice.total ? 'paid' : 'partially_paid';

    await updateDoc(invoiceRef, {
      paidAmount: newPaidAmount,
      paymentStatus: newPaymentStatus,
      paymentMethod,
      lastPaymentDate: paymentDate || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }
};
