import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

let initialized = false;
let adminAuth = null;

function getAdminAuth() {
  if (initialized) return adminAuth;
  initialized = true;
  const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env;
  if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) return null;

  try {
    const app =
      getApps()[0] ||
      initializeApp({
        credential: cert({
          projectId: FIREBASE_PROJECT_ID,
          clientEmail: FIREBASE_CLIENT_EMAIL,
          privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
    adminAuth = getAuth(app);
  } catch {
    adminAuth = null;
  }
  return adminAuth;
}

export async function verifyOptionalFirebaseAuth(authorization) {
  if (process.env.REQUIRE_AUTH !== 'true') return { ok: true, user: null };
  const auth = getAdminAuth();
  if (!auth) return { ok: false, status: 503, message: 'Server authentication is not configured.' };

  const token = authorization?.replace(/^Bearer\s+/i, '');
  if (!token) return { ok: false, status: 401, message: 'Authentication required.' };
  try {
    return { ok: true, user: await auth.verifyIdToken(token) };
  } catch {
    return { ok: false, status: 401, message: 'Invalid or expired session.' };
  }
}
