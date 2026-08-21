import { appEnv } from '../config/env';
import { localStore } from './storageService';
import { readStoredJson, writeStoredJson } from '../utils/storage';

const isCloudUser = (uid) => Boolean(uid);
const CONVERSATIONS_KEY = 'devpilot-conversations';

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
  if (!isCloudUser(uid)) return readStoredJson(CONVERSATIONS_KEY, [], Array.isArray);
  return dataRequest('conversations');
}

export async function saveConversation(uid, conversation) {
  const local = readStoredJson(CONVERSATIONS_KEY, [], Array.isArray);
  const item = { ...conversation, id: crypto.randomUUID(), updatedAt: new Date().toISOString() };
  writeStoredJson(CONVERSATIONS_KEY, [item, ...local].slice(0, 20));
  if (!isCloudUser(uid)) return item;
  return dataRequest('conversations', { method: 'POST', body: JSON.stringify(conversation) });
}
