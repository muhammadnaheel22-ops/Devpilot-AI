# Security Policy

Do not report secrets in public issues. Rotate any exposed OpenRouter or Firebase service-account credential immediately.

Key controls included: server-only OpenRouter key, payload limits, input validation, rate limiting, CORS allow-list, Helmet headers, Firebase token verification, admin custom claims, restrictive Firestore/Storage rules, and no dynamic code execution.

Before production: require authentication, use a distributed rate-limit store, enable Firebase App Check, configure CSP at the hosting layer, add audit logs, dependency scanning, security tests, quotas, and billing alerts.
