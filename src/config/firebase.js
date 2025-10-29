import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAJSXmFTsf6msG66dJtkcIWHE3jarj4NEU",
  authDomain: "allinstock-ddb69.firebaseapp.com",
  projectId: "allinstock-ddb69",
  storageBucket: "allinstock-ddb69.firebasestorage.app",
  messagingSenderId: "824387170549",
  appId: "1:824387170549:web:9b57e48adf321a641795bc"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;