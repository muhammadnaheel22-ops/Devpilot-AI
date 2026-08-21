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
import {
  readStoredJson,
  readStoredValue,
  removeStoredValue,
  writeStoredJson,
} from '../utils/storage';

const AuthContext = createContext(null);
const DEMO_USER_KEY = 'devpilot-demo-user';
const demoUser = {
  uid: 'demo-user',
  displayName: 'DevPilot User',
  email: 'demo@devpilot.ai',
  emailVerified: true,
  isDemo: true,
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [, setUserRevision] = useState(0);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      const raw = readStoredValue(DEMO_USER_KEY);
      const saved = readStoredJson(
        DEMO_USER_KEY,
        null,
        (value) => value && typeof value === 'object',
      );
      setUser(saved || (raw ? demoUser : null));
      setLoading(false);
      return undefined;
    }
    return onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
        setLoading(false);
      },
      () => {
        setUser(null);
        setLoading(false);
      },
    );
  }, []);

  const requireFirebase = () => {
    if (!isFirebaseConfigured)
      throw new Error('Firebase is not configured. Add the VITE_FIREBASE_* values to .env.');
  };

  const login = async (email, password) => {
    if (!isFirebaseConfigured && appEnv.demoAuth) {
      const next = { ...demoUser, email };
      writeStoredJson(DEMO_USER_KEY, next);
      setUser(next);
      return next;
    }
    requireFirebase();
    return (await signInWithEmailAndPassword(auth, email, password)).user;
  };
  const register = async (name, email, password) => {
    if (!isFirebaseConfigured && appEnv.demoAuth) {
      const next = { ...demoUser, displayName: name, email };
      writeStoredJson(DEMO_USER_KEY, next);
      setUser(next);
      return next;
    }
    requireFirebase();
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user, { displayName: name });
    await sendEmailVerification(credential.user);
    setUser(credential.user);
    setUserRevision((value) => value + 1);
    return credential.user;
  };
  const socialLogin = async (providerName) => {
    if (!isFirebaseConfigured && appEnv.demoAuth) {
      writeStoredJson(DEMO_USER_KEY, demoUser);
      setUser(demoUser);
      return demoUser;
    }
    requireFirebase();
    const provider =
      providerName === 'github' ? new GithubAuthProvider() : new GoogleAuthProvider();
    return (await signInWithPopup(auth, provider)).user;
  };
  const resetPassword = async (email) => {
    requireFirebase();
    return sendPasswordResetEmail(auth, email);
  };
  const logout = async () => {
    if (isFirebaseConfigured) await signOut(auth);
    removeStoredValue(DEMO_USER_KEY);
    setUser(null);
  };
  const getToken = async () => {
    const currentUser = isFirebaseConfigured ? auth?.currentUser : user;
    return currentUser && !currentUser.isDemo && currentUser.getIdToken
      ? currentUser.getIdToken()
      : null;
  };
  const updateUserProfile = async ({ displayName, photoURL }) => {
    if (!user) throw new Error('You must be signed in.');
    const changes = {};
    if (displayName !== undefined) {
      const normalizedName = displayName.trim();
      if (!normalizedName) throw new Error('Display name cannot be empty.');
      if (normalizedName.length > 80)
        throw new Error('Display name must be 80 characters or less.');
      changes.displayName = normalizedName;
    }
    if (photoURL !== undefined) changes.photoURL = photoURL || null;
    if (!isFirebaseConfigured || user.isDemo) {
      const next = { ...user, ...changes };
      writeStoredJson(DEMO_USER_KEY, next);
      setUser(next);
      return next;
    }
    const currentUser = auth?.currentUser;
    if (!currentUser) throw new Error('Your session has expired. Sign in again.');
    await updateProfile(currentUser, changes);
    setUser(currentUser);
    setUserRevision((value) => value + 1);
    return currentUser;
  };

  const value = {
    user,
    loading,
    login,
    register,
    socialLogin,
    resetPassword,
    logout,
    getToken,
    updateUserProfile,
    isFirebaseConfigured,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
