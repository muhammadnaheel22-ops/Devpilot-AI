const SNIPPETS_KEY = 'devpilot-snippets';
const ACTIVITY_KEY = 'devpilot-activity';
export const localStore = {
  getSnippets: () => JSON.parse(localStorage.getItem(SNIPPETS_KEY) || '[]'),
  saveSnippets: (items) => localStorage.setItem(SNIPPETS_KEY, JSON.stringify(items)),
  addSnippet: (item) => {
    const next = [
      { id: crypto.randomUUID(), createdAt: new Date().toISOString(), ...item },
      ...localStore.getSnippets(),
    ];
    localStore.saveSnippets(next);
    return next;
  },
  getActivity: () => JSON.parse(localStorage.getItem(ACTIVITY_KEY) || '[]'),
  addActivity: (activity) => {
    const next = [
      { id: crypto.randomUUID(), at: new Date().toISOString(), ...activity },
      ...localStore.getActivity(),
    ].slice(0, 50);
    localStorage.setItem(ACTIVITY_KEY, JSON.stringify(next));
    return next;
  },
};
