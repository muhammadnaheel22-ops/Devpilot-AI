import { initializeApp, getApps } from 'firebase/app';
import { getAuth, browserLocalPersistence, setPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { appEnv, isFirebaseConfigured } from '../config/env';

let firebaseApp = null;
let auth = null;
let db = null;
let storage = null;

if (isFirebaseConfigured) {
  firebaseApp = getApps()[0] || initializeApp(appEnv.firebase);
  auth = getAuth(firebaseApp);
  db = getFirestore(firebaseApp);
  storage = getStorage(firebaseApp);
  setPersistence(auth, browserLocalPersistence).catch(console.error);
}

export { firebaseApp, auth, db, storage, isFirebaseConfigured };
