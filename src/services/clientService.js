import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  orderBy,
  where
} from 'firebase/firestore';
import { db } from '../config/firebase';

async function getClients(companyId) {
  const clientsRef = collection(db, 'companies', companyId, 'clients');
  const q = query(clientsRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

async function getClient(companyId, clientId) {
  const clientRef = doc(db, 'companies', companyId, 'clients', clientId);
  const docSnap = await getDoc(clientRef);

  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  }

  return null;
}

async function createClient(companyId, clientData) {
  const clientsRef = collection(db, 'companies', companyId, 'clients');
  const newClient = {
    ...clientData,
    status: clientData.status || 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const docRef = await addDoc(clientsRef, newClient);
  return docRef.id;
}

async function updateClient(companyId, clientId, clientData) {
  const clientRef = doc(db, 'companies', companyId, 'clients', clientId);
  await updateDoc(clientRef, {
    ...clientData,
    updatedAt: new Date().toISOString()
  });
}

async function deleteClient(companyId, clientId) {
  const clientRef = doc(db, 'companies', companyId, 'clients', clientId);
  await deleteDoc(clientRef);
}

async function toggleClientStatus(companyId, clientId) {
  const client = await getClient(companyId, clientId);
  if (client) {
    const newStatus = client.status === 'active' ? 'inactive' : 'active';
    await updateClient(companyId, clientId, { status: newStatus });
  }
}

async function searchClients(companyId, searchTerm) {
  const clients = await getClients(companyId);

  if (!searchTerm) return clients;

  const term = searchTerm.toLowerCase();
  return clients.filter(client =>
    client.name?.toLowerCase().includes(term) ||
    client.companyName?.toLowerCase().includes(term) ||
    client.email?.toLowerCase().includes(term) ||
    client.phone?.includes(term) ||
    client.taxId?.toLowerCase().includes(term)
  );
}

export const clientService = {
  getClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
  toggleClientStatus,
  searchClients
};
