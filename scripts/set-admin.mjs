import 'dotenv/config';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const email = process.argv[2];
if (!email) {
  console.error('Usage: npm run admin:grant -- admin@example.com');
  process.exitCode = 1;
} else if (
  !process.env.FIREBASE_PROJECT_ID ||
  !process.env.FIREBASE_CLIENT_EMAIL ||
  !process.env.FIREBASE_PRIVATE_KEY
) {
  console.error('Firebase Admin environment variables are required. See .env.example.');
  process.exitCode = 1;
} else {
  const app =
    getApps()[0] ||
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
  const auth = getAuth(app);
  const user = await auth.getUserByEmail(email);
  await auth.setCustomUserClaims(user.uid, { ...(user.customClaims || {}), admin: true });
  console.log(`Administrator access granted to ${email}. The user must sign in again.`);
}
