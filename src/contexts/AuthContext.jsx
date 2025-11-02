import { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadCompanyData = async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();

        // Super admins don't have a company - they manage all companies
        if (userData.role === 'super_admin') {
          setCompany(null);
          return;
        }

        // Regular users have a companyId
        if (userData.companyId) {
          const companyDoc = await getDoc(doc(db, 'companies', userData.companyId));
          if (companyDoc.exists()) {
            setCompany({ id: companyDoc.id, ...companyDoc.data() });
          }
        }
      }
    } catch (error) {
      console.error('Error loading company data:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await loadCompanyData(user.uid);
      } else {
        setCompany(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signUp = async (email, password, companyData) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const companyRef = doc(db, 'companies', user.uid);
    await setDoc(companyRef, {
      name: companyData.name,
      plan: companyData.plan || 'small',
      logo: companyData.logo || null,
      createdAt: new Date().toISOString(),
      ownerId: user.uid
    });

    await setDoc(doc(db, 'users', user.uid), {
      email: user.email,
      companyId: user.uid,
      role: 'owner',
      createdAt: new Date().toISOString()
    });

    await loadCompanyData(user.uid);
    return user;
  };

  const signIn = async (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setCompany(null);
  };

  const value = {
    currentUser,
    company,
    signUp,
    signIn,
    signOut,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};