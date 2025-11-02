import { collection, addDoc, getDocs, query, where, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Email Service
 * Handles email integration with Gmail/Outlook
 * Syncs emails and matches them to clients/suppliers
 */

class EmailService {
  /**
   * Save email configuration for company (including access token)
   */
  async saveEmailConfig(companyId, config) {
    try {
      const configRef = collection(db, 'companies', companyId, 'emailConfig');
      const existingQuery = query(configRef);
      const existingDocs = await getDocs(existingQuery);

      const configData = {
        ...config,
        updatedAt: new Date().toISOString()
      };

      if (existingDocs.empty) {
        await addDoc(configRef, {
          ...configData,
          createdAt: new Date().toISOString()
        });
      } else {
        // Update existing config
        const configDoc = existingDocs.docs[0];
        await updateDoc(doc(db, 'companies', companyId, 'emailConfig', configDoc.id), configData);
      }
    } catch (error) {
      console.error('Error saving email config:', error);
      throw error;
    }
  }

  /**
   * Get email configuration for company
   */
  async getEmailConfig(companyId) {
    try {
      const configRef = collection(db, 'companies', companyId, 'emailConfig');
      const snapshot = await getDocs(configRef);

      if (!snapshot.empty) {
        return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
      }
      return null;
    } catch (error) {
      console.error('Error getting email config:', error);
      throw error;
    }
  }

  /**
   * Save synced email to Firestore
   */
  async saveEmail(companyId, emailData) {
    try {
      const emailsRef = collection(db, 'companies', companyId, 'emails');

      // Check if email already exists (by messageId)
      const existingQuery = query(emailsRef, where('messageId', '==', emailData.messageId));
      const existingDocs = await getDocs(existingQuery);

      if (existingDocs.empty) {
        await addDoc(emailsRef, {
          ...emailData,
          syncedAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error saving email:', error);
      throw error;
    }
  }

  /**
   * Get all emails for a specific contact (client or supplier)
   */
  async getContactEmails(companyId, contactEmail) {
    try {
      const emailsRef = collection(db, 'companies', companyId, 'emails');

      // Query emails where contact is in from or to
      const fromQuery = query(
        emailsRef,
        where('from', '==', contactEmail),
        orderBy('date', 'desc')
      );

      const toQuery = query(
        emailsRef,
        where('to', 'array-contains', contactEmail),
        orderBy('date', 'desc')
      );

      const [fromSnapshot, toSnapshot] = await Promise.all([
        getDocs(fromQuery),
        getDocs(toQuery)
      ]);

      const emails = new Map();

      fromSnapshot.docs.forEach(doc => {
        emails.set(doc.id, { id: doc.id, ...doc.data() });
      });

      toSnapshot.docs.forEach(doc => {
        emails.set(doc.id, { id: doc.id, ...doc.data() });
      });

      return Array.from(emails.values()).sort((a, b) =>
        new Date(b.date) - new Date(a.date)
      );
    } catch (error) {
      console.error('Error getting contact emails:', error);
      throw error;
    }
  }

  /**
   * Get all emails for company
   */
  async getAllEmails(companyId, limit = 100) {
    try {
      const emailsRef = collection(db, 'companies', companyId, 'emails');
      const q = query(emailsRef, orderBy('date', 'desc'));

      const snapshot = await getDocs(q);
      return snapshot.docs.slice(0, limit).map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting all emails:', error);
      throw error;
    }
  }

  /**
   * Match email addresses to clients and suppliers
   */
  async matchEmailsToContacts(companyId) {
    try {
      // Get all clients and suppliers
      const [clientsSnapshot, suppliersSnapshot] = await Promise.all([
        getDocs(collection(db, 'companies', companyId, 'clients')),
        getDocs(collection(db, 'companies', companyId, 'suppliers'))
      ]);

      const contactMap = new Map();

      clientsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.email) {
          contactMap.set(data.email.toLowerCase(), {
            id: doc.id,
            name: data.name,
            type: 'client',
            email: data.email
          });
        }
      });

      suppliersSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.email) {
          contactMap.set(data.email.toLowerCase(), {
            id: doc.id,
            name: data.name,
            type: 'supplier',
            email: data.email
          });
        }
      });

      return contactMap;
    } catch (error) {
      console.error('Error matching emails to contacts:', error);
      throw error;
    }
  }

  /**
   * Get sync statistics
   */
  async getSyncStats(companyId) {
    try {
      const emailsRef = collection(db, 'companies', companyId, 'emails');
      const snapshot = await getDocs(emailsRef);

      const stats = {
        totalEmails: snapshot.size,
        clientEmails: 0,
        supplierEmails: 0,
        unmatchedEmails: 0,
        lastSyncDate: null
      };

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.contactType === 'client') stats.clientEmails++;
        else if (data.contactType === 'supplier') stats.supplierEmails++;
        else stats.unmatchedEmails++;

        const syncDate = new Date(data.syncedAt);
        if (!stats.lastSyncDate || syncDate > stats.lastSyncDate) {
          stats.lastSyncDate = data.syncedAt;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error getting sync stats:', error);
      throw error;
    }
  }

  /**
   * Delete email configuration
   */
  async deleteEmailConfig(companyId, configId) {
    try {
      await deleteDoc(doc(db, 'companies', companyId, 'emailConfig', configId));
    } catch (error) {
      console.error('Error deleting email config:', error);
      throw error;
    }
  }

  /**
   * Search emails
   */
  async searchEmails(companyId, searchTerm) {
    try {
      const emailsRef = collection(db, 'companies', companyId, 'emails');
      const snapshot = await getDocs(emailsRef);

      const lowerSearch = searchTerm.toLowerCase();

      return snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(email =>
          email.subject?.toLowerCase().includes(lowerSearch) ||
          email.from?.toLowerCase().includes(lowerSearch) ||
          email.to?.some(addr => addr.toLowerCase().includes(lowerSearch)) ||
          email.body?.toLowerCase().includes(lowerSearch)
        )
        .sort((a, b) => new Date(b.date) - new Date(a.date));
    } catch (error) {
      console.error('Error searching emails:', error);
      throw error;
    }
  }
}

export const emailService = new EmailService();
