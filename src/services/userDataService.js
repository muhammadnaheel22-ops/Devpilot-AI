import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, isFirebaseConfigured } from '../firebase/firebase';
import { localStore } from './storageService';
import { readStoredJson, writeStoredJson } from '../utils/storage';

const isCloudUser = (uid) => isFirebaseConfigured && db && uid && uid !== 'demo-user';
const CONVERSATIONS_KEY = 'devpilot-conversations';
const normalizeDate = (value) =>
  value?.toDate?.().toISOString?.() || value || new Date().toISOString();

export async function getUserSnippets(uid) {
  if (!isCloudUser(uid)) return localStore.getSnippets();
  const snapshot = await getDocs(
    query(collection(db, 'users', uid, 'snippets'), orderBy('createdAt', 'desc'), limit(100)),
  );
  return snapshot.docs.map((item) => ({
    ...item.data(),
    id: item.id,
    createdAt: normalizeDate(item.data().createdAt),
  }));
}

export async function addUserSnippet(uid, item) {
  const localItems = localStore.addSnippet(item);
  if (!isCloudUser(uid)) return localItems[0];
  const result = await addDoc(collection(db, 'users', uid, 'snippets'), {
    ...item,
    createdAt: serverTimestamp(),
  });
  return { ...item, id: result.id, createdAt: new Date().toISOString() };
}

export async function deleteUserSnippet(uid, id) {
  const localItems = localStore.getSnippets().filter((item) => item.id !== id);
  localStore.saveSnippets(localItems);
  if (isCloudUser(uid)) await deleteDoc(doc(db, 'users', uid, 'snippets', id));
}

export async function getUserActivity(uid) {
  if (!isCloudUser(uid)) return localStore.getActivity();
  const snapshot = await getDocs(
    query(collection(db, 'users', uid, 'activity'), orderBy('at', 'desc'), limit(50)),
  );
  return snapshot.docs.map((item) => ({
    ...item.data(),
    id: item.id,
    at: normalizeDate(item.data().at),
  }));
}

export async function recordActivity(uid, activity) {
  localStore.addActivity(activity);
  if (isCloudUser(uid))
    await addDoc(collection(db, 'users', uid, 'activity'), { ...activity, at: serverTimestamp() });
}

export async function getConversations(uid) {
  if (!isCloudUser(uid)) return readStoredJson(CONVERSATIONS_KEY, [], Array.isArray);
  const snapshot = await getDocs(
    query(collection(db, 'users', uid, 'conversations'), orderBy('updatedAt', 'desc'), limit(20)),
  );
  return snapshot.docs.map((item) => ({
    ...item.data(),
    id: item.id,
    updatedAt: normalizeDate(item.data().updatedAt),
  }));
}

export async function saveConversation(uid, conversation) {
  const local = readStoredJson(CONVERSATIONS_KEY, [], Array.isArray);
  const item = { ...conversation, id: crypto.randomUUID(), updatedAt: new Date().toISOString() };
  writeStoredJson(CONVERSATIONS_KEY, [item, ...local].slice(0, 20));
  if (!isCloudUser(uid)) return item;
  const result = await addDoc(collection(db, 'users', uid, 'conversations'), {
    ...conversation,
    updatedAt: serverTimestamp(),
  });
  return { ...item, id: result.id };
}

export async function uploadUserAsset(uid, file) {
  if (!isCloudUser(uid) || !storage) throw new Error('Firebase Storage is not configured.');
  if (file.size > 5 * 1024 * 1024) throw new Error('File must be smaller than 5 MB.');
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
  const objectRef = ref(storage, `users/${uid}/profile/${Date.now()}-${safeName}`);
  await uploadBytes(objectRef, file, { contentType: file.type || 'application/octet-stream' });
  return getDownloadURL(objectRef);
}
