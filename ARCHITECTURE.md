# Architecture

```text
Browser (React 19 + Redux + TanStack Query + Monaco)
  | Firebase Authentication ID token
  | HTTPS/SSE
  v
Gemini API adapter (Express / Vercel / Netlify / Firebase Functions)
  | validation + rate limits + auth + server-only secret
  v
Google Gemini API

Browser <-> Firebase Auth / Firestore / Storage
```

The frontend is feature-oriented and lazy-loaded. AI modules reuse one `AIWorkspace`, keeping prompt policies, streaming, language selection, editor behavior, exports, and history consistent. Hosting adapters deliberately expose the same `/api/gemini/stream` contract.
