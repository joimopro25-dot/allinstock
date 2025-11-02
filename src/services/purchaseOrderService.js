import { collection, getDocs, getDoc, doc, addDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';

export const purchaseOrderService = {
  async getPurchaseOrders(companyId) {
    const purchaseOrdersRef = collection(db, 'companies', companyId, 'purchaseOrders');
    const snapshot = await getDocs(purchaseOrdersRef);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  },

  async getPurchaseOrder(companyId, purchaseOrderId) {
    const purchaseOrderRef = doc(db, 'companies', companyId, 'purchaseOrders', purchaseOrderId);
    const purchaseOrderDoc = await getDoc(purchaseOrderRef);

    if (!purchaseOrderDoc.exists()) {
      throw new Error('Purchase order not found');
    }

    return {
      id: purchaseOrderDoc.id,
      ...purchaseOrderDoc.data()
    };
  },

  async createPurchaseOrder(companyId, purchaseOrderData) {
    const purchaseOrdersRef = collection(db, 'companies', companyId, 'purchaseOrders');

    // Generate PO number
    const snapshot = await getDocs(purchaseOrdersRef);
    const poNumber = `PO-${String(snapshot.size + 1).padStart(5, '0')}`;

    const docRef = await addDoc(purchaseOrdersRef, {
      ...purchaseOrderData,
      poNumber,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return docRef.id;
  },

  async updatePurchaseOrder(companyId, purchaseOrderId, purchaseOrderData) {
    const purchaseOrderRef = doc(db, 'companies', companyId, 'purchaseOrders', purchaseOrderId);
    await updateDoc(purchaseOrderRef, {
      ...purchaseOrderData,
      updatedAt: new Date().toISOString()
    });
  },

  async deletePurchaseOrder(companyId, purchaseOrderId) {
    const purchaseOrderRef = doc(db, 'companies', companyId, 'purchaseOrders', purchaseOrderId);
    await deleteDoc(purchaseOrderRef);
  },

  async updatePurchaseOrderStatus(companyId, purchaseOrderId, status) {
    const purchaseOrderRef = doc(db, 'companies', companyId, 'purchaseOrders', purchaseOrderId);
    await updateDoc(purchaseOrderRef, {
      status,
      updatedAt: new Date().toISOString(),
      ...(status === 'received' ? { receivedDate: new Date().toISOString() } : {})
    });
  },

  async receivePurchaseOrder(companyId, purchaseOrderId) {
    const purchaseOrderRef = doc(db, 'companies', companyId, 'purchaseOrders', purchaseOrderId);
    const purchaseOrderDoc = await getDoc(purchaseOrderRef);

    if (!purchaseOrderDoc.exists()) {
      throw new Error('Purchase order not found');
    }

    const purchaseOrder = purchaseOrderDoc.data();

    // Update PO status
    await updateDoc(purchaseOrderRef, {
      status: 'received',
      receivedDate: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Update product stock for each item
    for (const item of purchaseOrder.items) {
      if (item.productId) {
        const productRef = doc(db, 'companies', companyId, 'products', item.productId);
        const productDoc = await getDoc(productRef);

        if (productDoc.exists()) {
          const product = productDoc.data();
          const newStock = (product.stock || 0) + (item.quantity || 0);

          await updateDoc(productRef, {
            stock: newStock,
            updatedAt: new Date().toISOString()
          });

          // Add stock movement record
          const movementsRef = collection(db, 'companies', companyId, 'products', item.productId, 'movements');
          await addDoc(movementsRef, {
            type: 'in',
            quantity: item.quantity,
            reason: `Purchase Order ${purchaseOrder.poNumber}`,
            supplierId: purchaseOrder.supplierId,
            supplierName: purchaseOrder.supplierName,
            date: new Date().toISOString(),
            createdAt: new Date().toISOString()
          });
        }
      }
    }
  }
};
