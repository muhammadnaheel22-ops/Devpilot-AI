# Architecture

```text
Browser (React)
  | HTTP-only session cookie
  | HTTPS / server-sent events
  v
Vercel Functions (also available through local Express)
  | session validation and authorization
  +---------------------> OpenRouter chat completions API
  |
  +---------------------> Neon Serverless Postgres over HTTP

Admin dashboard
  | database-backed is_admin role
  v
Admin API -> Neon account directory + Neon usage records
```

Neon stores application accounts, password hashes, session hashes, profiles, snippets, activity, conversations, and AI request audit records. The browser never receives the Neon connection string, OpenRouter key, password hashes, or raw session records.

Vercel Functions use `@neondatabase/serverless` for one-shot queries. The schema is versioned in `database/schema.sql` and applied with `npm run db:migrate`.

OpenRouter requests support three routing modes: `openrouter/auto`, a user-selected model, or an ordered `models` fallback chain. The server validates manual selections against the API-key-filtered `/api/v1/models/user` catalog, caches that catalog for ten minutes, and streams the concrete model selected by OpenRouter back to the client.
