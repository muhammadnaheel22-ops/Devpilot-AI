const env = import.meta.env;
export const appEnv = {
  apiBaseUrl: env.VITE_API_BASE_URL || '/api',
  demoAuth: env.VITE_ENABLE_DEMO_AUTH !== 'false',
  firebase: {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID,
  },
};
export const isFirebaseConfigured = Boolean(appEnv.firebase.apiKey && appEnv.firebase.projectId);
