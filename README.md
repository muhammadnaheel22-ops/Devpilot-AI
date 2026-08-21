# DevPilot AI

AI developer workspace built with React 19, Vite, Tailwind CSS, OpenRouter, Vercel Functions, and Neon Postgres.

## Features

- Streamed OpenRouter chat and developer tools with selectable models.
- Custom email/password authentication stored in Neon.
- Server-created HTTP-only sessions, server-side password hashing, validation, and authorization.
- Neon-backed accounts, profiles, conversations, snippets, activity, AI logs, and administrator roles.
- Searchable user history for complete chat conversations and AI tool requests.
- Admin dashboard for accounts, roles, recent AI requests, failures, models, and latency.

## Requirements

- Node.js 20.19+
- An [OpenRouter](https://openrouter.ai/) API key
- A [Neon](https://console.neon.tech/) Postgres database

## Local setup

```bash
npm install
cp .env.example .env
npm run db:migrate
npm run dev
```

Open `http://localhost:5173`; the Express API runs on `http://localhost:8787`.

Configure these values in `.env`:

```env
VITE_API_BASE_URL=/api
OPENROUTER_API_KEY=your-server-only-key
OPENROUTER_MODEL=openai/gpt-4o-mini
DATABASE_URL=postgresql://user:password@ep-example-pooler.region.aws.neon.tech/neondb?sslmode=require
ADMIN_EMAILS=muhammadnaheel904@gmail.com
```

Never prefix database or OpenRouter secrets with `VITE_`; Vite variables are shipped to the browser.

## Authentication

Run `npm run db:migrate`, then register through the application. Passwords are hashed with Node.js `scrypt`; random session tokens are stored as SHA-256 hashes in Neon and delivered through HTTP-only, `SameSite=Lax` cookies.

Email addresses listed in `ADMIN_EMAILS` are promoted during registration or the next login. An existing Neon account can also be promoted directly:

```bash
npm run admin:grant -- admin@example.com
```

## Deploy to Vercel

1. Import the GitHub repository into Vercel.
2. Add the variables from `.env.example` under Project Settings → Environment Variables.
3. Set `CLIENT_ORIGIN` and `OPENROUTER_SITE_URL` to the production URL.
4. Set `REQUIRE_AUTH=true`.
5. Run `npm run db:migrate` once against the production `DATABASE_URL`.
6. Redeploy.

## Validation

```bash
npm run lint
npm run format:check
npm run build
```

## Project layout

```text
src/                       # React application and service clients
server/auth.mjs            # password hashing and session authorization
server/database.mjs        # Neon repositories
api/                       # Vercel functions
database/schema.sql        # Neon Postgres schema
scripts/set-admin.mjs      # Neon administrator utility
```
