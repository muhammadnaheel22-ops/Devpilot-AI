# DevPilot AI

Production-ready AI developer assistant built with React 19, Vite, Tailwind CSS, Firebase, Monaco Editor, Redux Toolkit, TanStack Query, and the official Google Gen AI SDK.

## What is included

- Premium landing page, responsive dashboard, dark/light/system theme, command palette (`Ctrl/Cmd + K`), lazy routes, skeleton/loading states, error boundary, and accessible interactions.
- Firebase email/password, Google, and GitHub authentication with session persistence, password reset, verification support, protected routes, and demo-auth mode for local UI testing.
- Streamed Gemini chat plus reusable AI workspaces for generation, debugging, explanation, optimization, documentation, conversion, SQL, regex, and UI generation.
- Monaco editor, Markdown rendering, syntax highlighting, copy/save/export actions, prompt library, saved snippets, REST API tester, JSON/Base64/JWT/UUID/password utilities, and analytics dashboards.
- Server-side Gemini proxy with Zod validation, payload limits, rate limiting, Helmet, CORS allow-list, optional Firebase ID-token verification, and no client-side AI secret.
- Firestore and Storage rules, GitHub Actions CI, ESLint, Prettier, Husky/lint-staged, Vercel, Netlify, and Firebase Hosting configurations.

## Requirements

- Node.js 20.19+ or Node.js 22.12+
- A Firebase project for production authentication/data
- A Gemini API key from Google AI Studio

## Local setup

```bash
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:5173`. The local API runs on `http://localhost:8787`.

Without Firebase values, demo authentication is available when `VITE_ENABLE_DEMO_AUTH=true`. AI generation still requires `GEMINI_API_KEY` in `.env`.

## Firebase setup

1. Create a Firebase project.
2. Add a Web App and copy its config to the `VITE_FIREBASE_*` variables.
3. Enable Email/Password, Google, and GitHub providers in Authentication.
4. Add your development and deployment domains to Authorized domains.
5. Create Firestore and Storage.
6. Deploy the included rules:

```bash
npm install -g firebase-tools
firebase login
cp .firebaserc.example .firebaserc
# Edit .firebaserc with your project ID
firebase deploy --only firestore:rules,storage
```

For GitHub login, create a GitHub OAuth App and copy the Firebase callback URL shown in the provider setup screen.

## Gemini security model

`GEMINI_API_KEY` is server-only. Never rename it to `VITE_GEMINI_API_KEY`; variables beginning with `VITE_` are embedded in the browser bundle.

For strict local/hosted API authentication, configure Firebase Admin values and set:

```env
REQUIRE_AUTH=true
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

## Build

```bash
npm run lint
npm run format:check
npm run build
npm run preview
```

## Deploy to Vercel

1. Import the repository in Vercel.
2. Add `GEMINI_API_KEY`, `GEMINI_MODEL`, and all `VITE_FIREBASE_*` variables.
3. Build command: `npm run build`; output directory: `dist`.
4. `vercel.json` maps `/api/gemini/stream` to the serverless function and preserves SPA routing.

## Deploy to Netlify

1. Import the repository.
2. Add environment variables.
3. Netlify reads `netlify.toml`; the Gemini stream is served by `netlify/functions/gemini.mjs`.
4. Set `VITE_API_BASE_URL=/api`.

## Deploy to Firebase Hosting + Functions

```bash
npm run build
cd functions && npm install && cd ..
firebase functions:secrets:set GEMINI_API_KEY
firebase deploy
```

In Firebase production, the included function requires a valid Firebase ID token.

## Firestore data model (recommended)

```text
users/{uid}
users/{uid}/conversations/{conversationId}
users/{uid}/snippets/{snippetId}
users/{uid}/projects/{projectId}
users/{uid}/usage/{eventId}
publicPrompts/{promptId}
```

The current UI uses local storage for snippets and activity so the complete interface works before Firestore is configured. Replace `src/services/storageService.js` with Firestore-backed repositories for synchronized multi-device data.

## Production checklist

- Restrict `CLIENT_ORIGIN` to your real domains.
- Enable `REQUIRE_AUTH=true` on Express/Vercel and add Firebase Admin credentials.
- Add Firebase App Check, abuse monitoring, quotas, billing alerts, and server-side usage logs.
- Keep security rules deny-by-default and test them with the Firebase Emulator Suite.
- Add end-to-end tests (Playwright), component tests, and a persistent rate-limit store for multi-instance deployment.
- Review AI outputs before execution; generated code is not automatically trusted or run.

## Folder structure

```text
src/
  app/ components/ config/ constants/ context/ firebase/
  pages/ routes/ services/ store/ styles/ utils/
server/                    # local/standalone Express Gemini API
api/                       # Vercel serverless adapter
netlify/functions/         # Netlify adapter
functions/                 # Firebase Functions adapter
```

## License

Private project starter. Add your preferred license before public distribution.
