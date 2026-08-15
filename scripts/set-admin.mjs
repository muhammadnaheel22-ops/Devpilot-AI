import 'dotenv/config';
import { setAuthUserAdmin } from '../server/database.mjs';

const email = process.argv[2]?.trim().toLowerCase();

if (!email) {
  console.error('Usage: npm run admin:grant -- admin@example.com');
  process.exitCode = 1;
} else if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is required. Add your Neon connection string to .env.');
  process.exitCode = 1;
} else {
  const user = await setAuthUserAdmin(email, true);
  if (!user) {
    console.error(`No Neon account exists for ${email}. Register the account first.`);
    process.exitCode = 1;
  } else {
    console.log(`Administrator access granted to ${email}. Sign out and sign in again.`);
  }
}
