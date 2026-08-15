# Architecture

```text
Browser (React + Firebase Authentication)
  | Firebase ID token
  | HTTPS / server-sent events
  v
Vercel Functions (also available through local Express)
  | validation, authorization, server-only credentials
  +---------------------> OpenRouter chat completions API
  |
  +---------------------> Neon Serverless Postgres over HTTP

Admin dashboard
  | Firebase ID token with admin=true custom claim
  v
Admin API -> Firebase Authentication directory + Neon usage records
```

Firebase is used only for authentication and optional profile-image storage. Neon is the application database for profiles, snippets, activity, conversations, and AI request audit records. The browser never receives the Neon connection string, OpenRouter key, or Firebase service-account credentials.

Vercel Functions use `@neondatabase/serverless` over HTTP for one-shot queries. The database schema is versioned in `database/schema.sql` and applied with `npm run db:migrate`.
