# DevPilot AI

AI developer workspace built with React 19, Vite, Tailwind CSS, OpenRouter, Vercel Functions, Neon Postgres, and Firebase Authentication.

## Features

- Streamed OpenRouter chat and developer tools for generation, debugging, explanation, optimization, documentation, conversion, SQL, regex, and UI work.
- Server-only OpenRouter and Neon credentials, Zod validation, request limits, CORS, Helmet, Firebase ID-token enforcement, and database-backed request logs.
- Firebase email/password, Google, and GitHub authentication; Neon-backed profiles, conversations, snippets, and activity.
- Admin dashboard for Firebase user accounts, roles, recent AI requests, failures, models, and latency. Admin data is protected by Firebase custom claims on the server.
- Vercel Functions and a local Express server using the same API contracts.

## Requirements

- Node.js 20.19+ (Node.js 22 for Firebase Functions)
- An [OpenRouter](https://openrouter.ai/) API key
- A Neon project for Postgres data
- A Firebase project for production authentication

## Local setup

```bash
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:5173`; the Express API runs on `http://localhost:8787`.

At minimum, configure:

```env
OPENROUTER_API_KEY=your-server-only-key
OPENROUTER_MODEL=openai/gpt-4o-mini
DATABASE_URL=your-pooled-neon-connection-string
```

Never prefix the OpenRouter key with `VITE_`; Vite variables are shipped to the browser.

## Neon database setup

1. Create a project at https://console.neon.tech/.
2. Click **Connect**, enable the pooled connection, and copy its connection string.
3. Set `DATABASE_URL` in `.env`.
4. Apply the checked-in schema:

```bash
npm run db:migrate
```

The data model is:

```text
user_profiles
conversations
snippets
activity
ai_requests
```

## Firebase Authentication setup

1. Create a Firebase project and Web App.
2. Enable Email/Password, Google, and/or GitHub in Authentication.
3. Copy the Web App values into the `VITE_FIREBASE_*` variables in `.env`.
4. Create a Firebase service account and configure `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY` only on the backend.
5. Enable Firebase Storage only if profile-image uploads are needed.

## Create an administrator

After the account exists in Firebase Authentication, configure the Firebase Admin environment variables and run:

```bash
npm run admin:grant -- admin@example.com
```

The account must sign out and back in so its refreshed ID token contains `admin=true`. The admin link then appears in the sidebar. The UI check is only navigation; `/api/admin/overview` independently verifies the signed token and custom claim.

## Security settings

For production, use:

```env
REQUIRE_AUTH=true
CLIENT_ORIGIN=https://your-domain.example
```

Also configure Firebase App Check, billing alerts, a shared rate-limit store, and a scheduled retention policy for `ai_requests`.

## Validation

```bash
npm run lint
npm run format:check
npm run build
```

## Deploy

Import the repository at https://vercel.com/new and configure the variables from `.env.example`. Run the Neon migration before promoting the first production deployment. The checked-in `vercel.json` maps the OpenRouter, data, and admin APIs plus the SPA fallback.

## Project layout

```text
src/                       # React application and service clients
server/                    # shared backend, Neon repositories, local Express API
api/                       # Vercel functions
database/schema.sql        # Neon Postgres schema
scripts/set-admin.mjs      # admin custom-claim utility
```
