import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { auth, googleProvider, AUTHORIZED_EMAIL } from '../firebase/config';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        if (user.email.toLowerCase() === AUTHORIZED_EMAIL.toLowerCase()) {
          setCurrentUser(user);
          setAuthError(null);
        } else {
          // Unauthorized email
          signOut(auth);
          setCurrentUser(null);
          setAuthError(`Acceso denegado. La cuenta ${user.email} no está autorizada.`);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const loginWithGoogle = async () => {
    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user.email.toLowerCase() !== AUTHORIZED_EMAIL.toLowerCase()) {
        await signOut(auth);
        setAuthError(`Acceso restringido. Solo ${AUTHORIZED_EMAIL} tiene acceso a este CRM.`);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error during login:', error);
      setAuthError(error.message);
      return false;
    }
  };

  const logout = () => {
    return signOut(auth);
  };

  const value = {
    currentUser,
    isAdmin: currentUser?.email?.toLowerCase() === AUTHORIZED_EMAIL.toLowerCase(),
    loading,
    authError,
    setAuthError,
    loginWithGoogle,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
