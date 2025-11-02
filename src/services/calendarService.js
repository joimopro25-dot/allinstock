import { db } from '../config/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore';

/**
 * Calendar Service - Manages calendar events in Firestore
 */

/**
 * Save Calendar config (access token, connected calendar)
 */
export async function saveCalendarConfig(companyId, config) {
  const configRef = doc(db, 'companies', companyId, 'calendarConfig', 'google');
  await setDoc(configRef, {
    ...config,
    updatedAt: new Date().toISOString()
  });
}

/**
 * Get Calendar config
 */
export async function getCalendarConfig(companyId) {
  const configRef = doc(db, 'companies', companyId, 'calendarConfig', 'google');
  const configDoc = await getDoc(configRef);
  return configDoc.exists() ? configDoc.data() : null;
}

/**
 * Delete Calendar config (disconnect)
 */
export async function deleteCalendarConfig(companyId) {
  const configRef = doc(db, 'companies', companyId, 'calendarConfig', 'google');
  await deleteDoc(configRef);
}

/**
 * Save event to Firestore
 */
export async function saveEvent(companyId, event) {
  const eventId = event.id || doc(collection(db, 'companies', companyId, 'calendarEvents')).id;
  const eventRef = doc(db, 'companies', companyId, 'calendarEvents', eventId);

  await setDoc(eventRef, {
    ...event,
    id: eventId,
    companyId,
    updatedAt: new Date().toISOString()
  }, { merge: true });

  return eventId;
}

/**
 * Get all events for a company
 */
export async function getEvents(companyId, startDate = null, endDate = null) {
  const eventsRef = collection(db, 'companies', companyId, 'calendarEvents');

  let q;
  if (startDate && endDate) {
    q = query(
      eventsRef,
      where('start', '>=', startDate),
      where('start', '<=', endDate),
      orderBy('start', 'asc')
    );
  } else {
    q = query(eventsRef, orderBy('start', 'desc'));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

/**
 * Get single event
 */
export async function getEvent(companyId, eventId) {
  const eventRef = doc(db, 'companies', companyId, 'calendarEvents', eventId);
  const eventDoc = await getDoc(eventRef);
  return eventDoc.exists() ? { id: eventDoc.id, ...eventDoc.data() } : null;
}

/**
 * Update event
 */
export async function updateEvent(companyId, eventId, updates) {
  const eventRef = doc(db, 'companies', companyId, 'calendarEvents', eventId);
  await updateDoc(eventRef, {
    ...updates,
    updatedAt: new Date().toISOString()
  });
}

/**
 * Delete event
 */
export async function deleteEvent(companyId, eventId) {
  const eventRef = doc(db, 'companies', companyId, 'calendarEvents', eventId);
  await deleteDoc(eventRef);
}

/**
 * Generate CRM events from various sources
 */
export async function generateCRMEvents(companyId) {
  const events = [];

  try {
    // 1. Delivery events from purchase orders
    const deliveryEvents = await generateDeliveryEvents(companyId);
    events.push(...deliveryEvents);

    // 2. Payment due events from invoices
    const paymentEvents = await generatePaymentEvents(companyId);
    events.push(...paymentEvents);

    // 3. Low stock alerts
    const stockAlerts = await generateStockAlerts(companyId);
    events.push(...stockAlerts);

    return events;
  } catch (error) {
    console.error('Error generating CRM events:', error);
    return [];
  }
}

/**
 * Generate delivery events from purchase orders
 */
async function generateDeliveryEvents(companyId) {
  const events = [];

  try {
    const purchaseOrdersRef = collection(db, 'companies', companyId, 'purchaseOrders');
    const q = query(purchaseOrdersRef, where('status', '==', 'pending'));
    const snapshot = await getDocs(q);

    snapshot.docs.forEach(doc => {
      const po = doc.data();
      if (po.expectedDeliveryDate) {
        const deliveryDate = new Date(po.expectedDeliveryDate);
        const endDate = new Date(deliveryDate);
        endDate.setHours(deliveryDate.getHours() + 1); // 1 hour event

        events.push({
          summary: `📦 Delivery: ${po.supplierName || 'Purchase Order'}`,
          description: `Purchase Order #${po.poNumber || doc.id}\nSupplier: ${po.supplierName}\nTotal: ${po.total || 0}`,
          start: deliveryDate.toISOString(),
          end: endDate.toISOString(),
          type: 'delivery',
          sourceId: doc.id,
          sourceType: 'purchaseOrder',
          color: '#10b981' // Green
        });
      }
    });
  } catch (error) {
    console.error('Error generating delivery events:', error);
  }

  return events;
}

/**
 * Generate payment events from invoices
 */
async function generatePaymentEvents(companyId) {
  const events = [];

  try {
    const invoicesRef = collection(db, 'companies', companyId, 'invoices');
    const q = query(invoicesRef, where('status', '==', 'pending'));
    const snapshot = await getDocs(q);

    snapshot.docs.forEach(doc => {
      const invoice = doc.data();
      if (invoice.dueDate) {
        const dueDate = new Date(invoice.dueDate);
        const endDate = new Date(dueDate);
        endDate.setHours(23, 59, 59); // End of day

        events.push({
          summary: `💰 Payment Due: ${invoice.clientName || 'Invoice'}`,
          description: `Invoice #${invoice.invoiceNumber || doc.id}\nClient: ${invoice.clientName}\nAmount: ${invoice.total || 0}`,
          start: dueDate.toISOString().split('T')[0], // All-day event
          end: endDate.toISOString().split('T')[0],
          type: 'payment',
          sourceId: doc.id,
          sourceType: 'invoice',
          color: '#f59e0b', // Orange
          isAllDay: true
        });
      }
    });
  } catch (error) {
    console.error('Error generating payment events:', error);
  }

  return events;
}

/**
 * Generate low stock alerts
 */
async function generateStockAlerts(companyId) {
  const events = [];

  try {
    const stockRef = collection(db, 'companies', companyId, 'stock');
    const snapshot = await getDocs(stockRef);

    const lowStockProducts = [];
    snapshot.docs.forEach(doc => {
      const product = doc.data();
      if (product.quantity <= (product.minStock || 10)) {
        lowStockProducts.push(product);
      }
    });

    if (lowStockProducts.length > 0) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0); // 9 AM tomorrow

      const endDate = new Date(tomorrow);
      endDate.setHours(10, 0, 0, 0); // 10 AM tomorrow

      events.push({
        summary: `⚠️ Low Stock Alert: ${lowStockProducts.length} products`,
        description: `Products low on stock:\n${lowStockProducts.map(p => `- ${p.name}: ${p.quantity} units`).join('\n')}`,
        start: tomorrow.toISOString(),
        end: endDate.toISOString(),
        type: 'alert',
        sourceType: 'stock',
        color: '#ef4444', // Red
        recurring: 'daily'
      });
    }
  } catch (error) {
    console.error('Error generating stock alerts:', error);
  }

  return events;
}

/**
 * Sync CRM events to Google Calendar
 */
export async function syncCRMEventsToGoogle(companyId, calendarIntegration) {
  try {
    // Generate all CRM events
    const crmEvents = await generateCRMEvents(companyId);

    const syncedEvents = [];
    for (const event of crmEvents) {
      try {
        // Check if event already exists in Firestore
        const existingEvents = await getEvents(companyId);
        const existing = existingEvents.find(e =>
          e.sourceId === event.sourceId &&
          e.sourceType === event.sourceType
        );

        if (existing && existing.googleEventId) {
          // Update existing event
          await calendarIntegration.updateEvent(existing.googleEventId, event);
          await updateEvent(companyId, existing.id, event);
        } else {
          // Create new event
          const googleEvent = await calendarIntegration.createEvent(event);
          const eventData = {
            ...event,
            googleEventId: googleEvent.id,
            syncedAt: new Date().toISOString()
          };
          await saveEvent(companyId, eventData);
        }

        syncedEvents.push(event);
      } catch (error) {
        console.error('Error syncing event:', event, error);
      }
    }

    return syncedEvents;
  } catch (error) {
    console.error('Error syncing CRM events to Google:', error);
    throw error;
  }
}
