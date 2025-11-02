import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCwIve4PFG6i7jkPV-2Hxq4s0eJtF2CG2M",
  authDomain: "allinstock-ded6e.firebaseapp.com",
  projectId: "allinstock-ded6e",
  storageBucket: "allinstock-ded6e.firebasestorage.app",
  messagingSenderId: "842871801549",
  appId: "1:842871801549:web:ef5e3da0ee17bc04c0cb84",
  measurementId: "G-SNLXKVNKF6"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;