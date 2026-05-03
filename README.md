# ReadyRepo

[![Live Demo](https://img.shields.io/badge/Live%20Demo-readyrepo.vercel.app-black?style=flat&logo=vercel)](https://readyrepo.vercel.app/)

Paste a job posting URL. ReadyRepo analyzes the job's tone, scores your GitHub repos against it, and generates tailored README rewrites — so your profile matches what the hiring manager is actually looking for.

## Built with

![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=flat&logo=firebase&logoColor=black)
![Gemini](https://img.shields.io/badge/Gemini_API-4285F4?style=flat&logo=google&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=flat&logo=express&logoColor=white)

## Highlights

- **Full-stack monorepo** — React + Vite frontend, Express API, and a shared TypeScript types workspace (`@readyrepo/shared`) consumed by both
- **AI-powered analysis** — Gemini API generates README rewrites grounded to real repo metadata; Google Cloud NL API drives tone detection with a keyword fallback
- **Auth & access control** — Firebase Auth (GitHub OAuth), protected routes, and a two-tier system (Free: 3 analyses/month · Pro: unlimited + history)
- **Atomic rate limiting** — quota check and increment run in a single Firestore transaction to prevent race-condition overruns
- **Production-minded details** — request timeouts, Zod input validation, CORS allowlist, redacted auth headers in logs, in-memory LRU cache for tone results, `safeRedirect` to prevent open redirects, `ErrorBoundary`, offline banner

## Local setup

<details>
<summary>Prerequisites · env variables · dev server</summary>

**Prerequisites:** Node.js 20+, npm 9+

```bash
npm install
cp server/.env.example .env
```

**`server/.env`**
```env
GEMINI_API_KEY=...
FIREBASE_PROJECT_ID=...
CLIENT_ORIGIN=http://localhost:5173
```

**`client/.env.local`**
```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_APP_ID=...
VITE_API_URL=http://localhost:8080/api/v1
```

```bash
npm run dev
# Client → http://localhost:5173
# API    → http://localhost:8080
```

</details>
