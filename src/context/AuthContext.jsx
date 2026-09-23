import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
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
    // Process redirect result if returning from Google OAuth redirect (common in mobile PWAs)
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          if (result.user.email.toLowerCase() !== AUTHORIZED_EMAIL.toLowerCase()) {
            signOut(auth);
            setAuthError(`Acceso denegado. Solo ${AUTHORIZED_EMAIL} tiene acceso a este CRM.`);
          }
        }
      })
      .catch((error) => {
        if (error.code !== 'auth/credential-already-in-use') {
          console.warn('Redirect auth result warning:', error.message);
        }
      });

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
    const isStandalone = 
      typeof window !== 'undefined' && 
      (window.matchMedia('(display-mode: standalone)').matches || Boolean(window.navigator.standalone));

    try {
      if (isStandalone) {
        // Mobile standalone PWAs frequently block popups; use redirect instead
        await signInWithRedirect(auth, googleProvider);
        return true;
      }

      const result = await signInWithPopup(auth, googleProvider);
      if (result.user.email.toLowerCase() !== AUTHORIZED_EMAIL.toLowerCase()) {
        await signOut(auth);
        setAuthError(`Acceso restringido. Solo ${AUTHORIZED_EMAIL} tiene acceso a este CRM.`);
        return false;
      }
      return true;
    } catch (error) {
      console.warn('Popup login failed, attempting redirect fallback:', error);
      if (
        error.code === 'auth/popup-blocked' || 
        error.code === 'auth/cancelled-popup-request' ||
        error.code === 'auth/popup-closed-by-user' ||
        isStandalone
      ) {
        try {
          await signInWithRedirect(auth, googleProvider);
          return true;
        } catch (redirError) {
          console.error('Redirect sign-in error:', redirError);
          setAuthError(redirError.message);
          return false;
        }
      }
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
