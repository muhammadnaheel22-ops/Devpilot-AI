# Security Policy

Do not report or commit secrets in public issues. Rotate any exposed OpenRouter or Neon credential immediately.

Included controls: server-only credentials, `scrypt` password hashing with unique salts, random session tokens stored only as SHA-256 hashes, HTTP-only `SameSite=Lax` cookies, server-side role checks, payload validation, request limits, CORS allow-list, Helmet headers, and no dynamic code execution.

Before production: use HTTPS, set `REQUIRE_AUTH=true`, configure a distributed rate-limit store and Content Security Policy, add password-reset email delivery, add audit logs, run dependency/security scanning, and configure quotas, retention, backups, and billing alerts.
