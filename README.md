# DevPilot AI

DevPilot AI is a full-stack developer workspace for AI chat, code generation, debugging, explanation, optimization, documentation, conversion, SQL, regular expressions, and UI generation.

**Live application:** [https://devpilot-ai-alpha.vercel.app](https://devpilot-ai-alpha.vercel.app)



## Highlights

- React 19 workspace with Monaco Editor, streamed Markdown output, syntax highlighting, copy, save, and export actions.
- OpenRouter integration restricted to explicit zero-cost `:free` text models.
- Automatic routing through `openrouter/free`, manual model selection, and ordered fallback chains of up to five free models.
- Server-side model validation prevents stale browser settings from submitting paid models.
- Credit-aware completion limits use `max_completion_tokens`, default to 1,024 tokens, and retry within an affordable limit when OpenRouter reports one.
- Mode-specific AI instructions match the requested scope: simple requests receive focused answers, while production detail is added only when requested or necessary.
- Theme-aware model and language selectors with consistent light and dark dropdown colors.
- Persistent routing preferences and response metadata showing which concrete model answered.
- Neon-backed authentication, profiles, conversations, snippets, activity history, AI request logs, and administrator roles.
- Server-created HTTP-only sessions, `scrypt` password hashing, validation, authorization, rate limiting, security headers, and sanitized public errors.
- Administrator dashboard for users, roles, recent AI requests, failures, selected models, and latency.

## Technology

- **Frontend:** React 19, Vite 8, Tailwind CSS 4, React Router, Redux Toolkit, TanStack Query, Monaco Editor
- **Backend:** Node.js, Express 5, Vercel Functions, Zod
- **AI:** OpenRouter streaming API with free-model auto, manual, and fallback routing
- **Database:** Neon Serverless Postgres
- **Security:** HTTP-only sessions, `scrypt`, Helmet, CORS, rate limiting, DOMPurify
- **Deployment:** Vercel

## AI tools

- AI Chat
- Code Generator
- Debug Assistant
- Code Explainer
- Code Optimizer
- Documentation Generator
- Code Converter
- SQL Generator
- Regex Generator
- UI Generator

## Requirements

- Node.js 20.19 or newer
- An [OpenRouter](https://openrouter.ai/) API key
- A [Neon](https://console.neon.tech/) Postgres database

## Local development

```bash
git clone https://github.com/muhammadnaheel22-ops/Devpilot-AI.git
cd Devpilot-AI
npm install
cp .env.example .env
npm run db:migrate
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The local Express API runs at `http://localhost:8787`.

### Environment variables

```env
VITE_API_BASE_URL=/api

OPENROUTER_API_KEY=your-server-only-key
OPENROUTER_MODEL=openrouter/free
OPENROUTER_MAX_COMPLETION_TOKENS=1024
OPENROUTER_SITE_URL=http://localhost:5173
OPENROUTER_APP_NAME=DevPilot AI

DATABASE_URL=postgresql://user:password@ep-example-pooler.region.aws.neon.tech/neondb?sslmode=require
PORT=8787
CLIENT_ORIGIN=http://localhost:5173
REQUIRE_AUTH=true
ADMIN_EMAILS=
```

Never prefix database or OpenRouter secrets with `VITE_`; Vite variables are included in the browser bundle.

## Free-model routing

The backend loads the account catalog from OpenRouter and exposes only text-generation models that:

1. use the `:free` suffix or the official `openrouter/free` router; and
2. report zero input and output pricing.

The same server-side catalog validates manual and fallback requests, so a paid model stored by an older browser session cannot bypass the free-only policy. The catalog is refreshed automatically, allowing newly available explicit free models to appear without a frontend release.

Routing modes:

- **Auto:** OpenRouter's free router selects an available zero-cost model.
- **Manual:** The request uses one selected free model.
- **Fallback:** OpenRouter tries the selected free models in order.

Free models are subject to OpenRouter availability and rate limits; they do not provide a guaranteed token balance.

## Authentication and administration

Run `npm run db:migrate`, then register through the application. Passwords are hashed with Node.js `scrypt`. Random session tokens are stored as SHA-256 hashes in Neon and delivered through HTTP-only, `SameSite=Lax` cookies.

Email addresses listed in `ADMIN_EMAILS` are promoted during registration or their next login. An existing Neon account can also be promoted directly:

```bash
npm run admin:grant -- admin@example.com
```

## Available commands

```bash
npm run dev          # Start Vite and the local Express API
npm test             # Run the Node.js test suite
npm run lint         # Run ESLint
npm run format       # Format the repository with Prettier
npm run format:check # Verify formatting
npm run build        # Create the production frontend build
npm run db:migrate   # Apply the Neon schema
npm run admin:grant -- admin@example.com
```

## Deploying to Vercel

1. Import the [GitHub repository](https://github.com/muhammadnaheel22-ops/Devpilot-AI) into Vercel.
2. Add the values from `.env.example` under **Project Settings → Environment Variables**.
3. Set `CLIENT_ORIGIN` and `OPENROUTER_SITE_URL` to the production URL.
4. Keep `OPENROUTER_MODEL=openrouter/free` and `REQUIRE_AUTH=true`.
5. Run `npm run db:migrate` once against the production `DATABASE_URL`.
6. Redeploy the project.

The included `vercel.json` maps the single-page application and API routes and adds security headers.

## Project structure

```text
api/                         Vercel Functions
database/schema.sql          Neon Postgres schema
netlify/functions/           Netlify-compatible function adapters
scripts/migrate-neon.mjs     Database migration utility
scripts/set-admin.mjs        Administrator role utility
server/auth.mjs              Authentication and session authorization
server/backend.mjs           AI routing, streaming, validation, and admin data
server/database.mjs          Neon repositories and connection handling
server/index.mjs             Local Express API
src/components/ai/           AI workspace and model-routing controls
src/pages/                   Application pages and dashboards
src/services/                Browser API clients
src/styles/                  Global theme and component styling
test/                        Node.js regression tests
```

## Validation

Before publishing changes, run:

```bash
npm test
npm run lint
npm run format:check
npm run build
```

## Security

Do not commit `.env` files, API keys, database credentials, session cookies, or other secrets. See [SECURITY.md](SECURITY.md) for the project's security guidance.
