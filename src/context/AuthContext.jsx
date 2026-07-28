import { createContext, useContext, useEffect, useState } from 'react';
import {
  GithubAuthProvider,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../firebase/firebase';
import { appEnv } from '../config/env';

const AuthContext = createContext(null);
const demoUser = { uid: 'demo-user', displayName: 'DevPilot User', email: 'demo@devpilot.ai', emailVerified: true, isDemo: true };

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      const saved = localStorage.getItem('devpilot-demo-user');
      setUser(saved ? demoUser : null);
      setLoading(false);
      return undefined;
    }
    return onAuthStateChanged(auth, (currentUser) => { setUser(currentUser); setLoading(false); });
  }, []);

  const requireFirebase = () => {
    if (!isFirebaseConfigured) throw new Error('Firebase is not configured. Add the VITE_FIREBASE_* values to .env.');
  };

  const login = async (email, password) => {
    if (!isFirebaseConfigured && appEnv.demoAuth) {
      localStorage.setItem('devpilot-demo-user', '1'); setUser({ ...demoUser, email }); return demoUser;
    }
    requireFirebase(); return (await signInWithEmailAndPassword(auth, email, password)).user;
  };
  const register = async (name, email, password) => {
    if (!isFirebaseConfigured && appEnv.demoAuth) {
      localStorage.setItem('devpilot-demo-user', '1'); const next = { ...demoUser, displayName: name, email }; setUser(next); return next;
    }
    requireFirebase();
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user, { displayName: name });
    await sendEmailVerification(credential.user);
    return credential.user;
  };
  const socialLogin = async (providerName) => {
    if (!isFirebaseConfigured && appEnv.demoAuth) { localStorage.setItem('devpilot-demo-user', '1'); setUser(demoUser); return demoUser; }
    requireFirebase();
    const provider = providerName === 'github' ? new GithubAuthProvider() : new GoogleAuthProvider();
    return (await signInWithPopup(auth, provider)).user;
  };
  const resetPassword = async (email) => { requireFirebase(); return sendPasswordResetEmail(auth, email); };
  const logout = async () => {
    if (isFirebaseConfigured) await signOut(auth);
    localStorage.removeItem('devpilot-demo-user'); setUser(null);
  };
  const getToken = async () => (user && !user.isDemo && user.getIdToken ? user.getIdToken() : null);
  const updateUserProfile = async ({ displayName, photoURL }) => {
    if (!user) throw new Error('You must be signed in.');
    if (!isFirebaseConfigured || user.isDemo) {
      const next = { ...user, ...(displayName ? { displayName } : {}), ...(photoURL ? { photoURL } : {}) };
      setUser(next);
      return next;
    }
    await updateProfile(user, { ...(displayName ? { displayName } : {}), ...(photoURL ? { photoURL } : {}) });
    setUser({ ...user, ...(displayName ? { displayName } : {}), ...(photoURL ? { photoURL } : {}) });
    return user;
  };

  const value = { user, loading, login, register, socialLogin, resetPassword, logout, getToken, updateUserProfile, isFirebaseConfigured };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
