import { appEnv } from '../config/env';
import { localStore } from './storageService';

const isCloudUser = (uid) => Boolean(uid);

async function dataRequest(path, options = {}) {
  const response = await fetch(`${appEnv.apiBaseUrl}/data/${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || 'Database request failed.');
  return payload;
}

export async function syncUserProfile(user) {
  if (!isCloudUser(user?.uid)) return;
  await dataRequest('profile', { method: 'POST' });
}

export async function getUserSnippets(uid) {
  if (!isCloudUser(uid)) return localStore.getSnippets();
  return dataRequest('snippets');
}

export async function addUserSnippet(uid, item) {
  const localItems = localStore.addSnippet(item);
  if (!isCloudUser(uid)) return localItems[0];
  return dataRequest('snippets', { method: 'POST', body: JSON.stringify(item) });
}

export async function deleteUserSnippet(uid, id) {
  localStore.saveSnippets(localStore.getSnippets().filter((item) => item.id !== id));
  if (isCloudUser(uid))
    await dataRequest(`snippets/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function getUserActivity(uid) {
  if (!isCloudUser(uid)) return localStore.getActivity();
  return dataRequest('activity');
}

export async function recordActivity(uid, activity) {
  localStore.addActivity(activity);
  if (isCloudUser(uid)) {
    await dataRequest('activity', { method: 'POST', body: JSON.stringify(activity) });
  }
}

export async function getConversations(uid) {
  if (!isCloudUser(uid)) return JSON.parse(localStorage.getItem('devpilot-conversations') || '[]');
  return dataRequest('conversations');
}

export async function saveConversation(uid, conversation) {
  const local = JSON.parse(localStorage.getItem('devpilot-conversations') || '[]');
  const item = { id: crypto.randomUUID(), updatedAt: new Date().toISOString(), ...conversation };
  localStorage.setItem('devpilot-conversations', JSON.stringify([item, ...local].slice(0, 20)));
  if (!isCloudUser(uid)) return item;
  return dataRequest('conversations', { method: 'POST', body: JSON.stringify(conversation) });
}
