import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { auth, googleProvider, isAuthorizedEmail, AUTHORIZED_EMAILS } from '../firebase/config';

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
          if (!isAuthorizedEmail(result.user.email)) {
            signOut(auth);
            setAuthError(`Acceso denegado. La cuenta ${result.user.email} no está autorizada.`);
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
        if (isAuthorizedEmail(user.email)) {
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

  const loginWithGoogle = async (forceRedirect = false) => {
    setAuthError(null);
    const isStandalone = 
      typeof window !== 'undefined' && 
      (window.matchMedia('(display-mode: standalone)').matches || Boolean(window.navigator.standalone));

    if (isStandalone || forceRedirect) {
      try {
        await signInWithRedirect(auth, googleProvider);
        return true;
      } catch (redirError) {
        console.error('Redirect sign-in error:', redirError);
        setAuthError(redirError.message);
        return false;
      }
    }

    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (!isAuthorizedEmail(result.user?.email)) {
        await signOut(auth);
        setAuthError(`Acceso restringido. La cuenta ${result.user?.email || ''} no está autorizada.`);
        return false;
      }
      return true;
    } catch (error) {
      console.warn('Popup login attempt:', error);
      
      // Si el usuario simplemente cerró la ventana emergente de Google, no mostrar un error alarmante
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        return false;
      }

      // Si la ventana emergente fue bloqueada en el móvil, intentar redirección o avisar amigablemente
      if (error.code === 'auth/popup-blocked') {
        try {
          await signInWithRedirect(auth, googleProvider);
          return true;
        } catch (redirError) {
          console.error('Redirect sign-in error after popup blocked:', redirError);
          setAuthError('La ventana emergente fue bloqueada. Usa el botón "Entrar por pantalla completa".');
          return false;
        }
      }

      if (error.code === 'auth/network-request-failed') {
        setAuthError('Error de conexión a internet. Revisa tu señal e intenta nuevamente.');
      } else {
        setAuthError(error.message || 'Error al autenticar con Google.');
      }
      return false;
    }
  };

  const logout = () => {
    return signOut(auth);
  };

  const value = {
    currentUser,
    isAdmin: isAuthorizedEmail(currentUser?.email),
    loading,
    authError,
    setAuthError,
    loginWithGoogle,
    loginWithGoogleRedirect: () => loginWithGoogle(true),
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
