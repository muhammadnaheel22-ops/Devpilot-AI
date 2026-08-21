import { readStoredJson, writeStoredJson } from '../utils/storage';

const SNIPPETS_KEY = 'devpilot-snippets';
const ACTIVITY_KEY = 'devpilot-activity';
const isArray = Array.isArray;
export const localStore = {
  getSnippets: () => readStoredJson(SNIPPETS_KEY, [], isArray),
  saveSnippets: (items) => writeStoredJson(SNIPPETS_KEY, items),
  addSnippet: (item) => {
    const next = [
      { ...item, id: crypto.randomUUID(), createdAt: new Date().toISOString() },
      ...localStore.getSnippets(),
    ];
    localStore.saveSnippets(next);
    return next;
  },
  getActivity: () => readStoredJson(ACTIVITY_KEY, [], isArray),
  addActivity: (activity) => {
    const next = [
      { ...activity, id: crypto.randomUUID(), at: new Date().toISOString() },
      ...localStore.getActivity(),
    ].slice(0, 50);
    writeStoredJson(ACTIVITY_KEY, next);
    return next;
  },
};
