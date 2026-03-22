# RepoMax
 
RepoMax is a web app + API that helps you tailor your GitHub presence to a specific job posting. It focuses on **tone analysis** of the job description and **AI-assisted README rewrites** (grounded to the repo’s actual metadata/README).
 
> Monorepo MVP foundation: UI + authenticated API + tone analysis + README generation.
 
## What’s in this repo
 
- **`client/`** — React + Vite + TypeScript (web UI)
- **`server/`** — Express + TypeScript (API, Firebase Admin auth, optional Google services)
- **`shared/`** — Shared TypeScript types used by client/server
 
## Current status (important)
 
This repo is an MVP foundation. A few endpoints are intentionally conservative/placeholder:
 
- **`POST /api/v1/analyze`** performs **job tone analysis** and returns an `analysisResult` shape with **scores set to 0** (the “full scoring engine” isn’t implemented in this build).
- **`POST /api/v1/generate-readme`** generates a README via Gemini **only when the repo has enough signals** (description/topics/languages/README length). It also sanitizes links so the model can’t invent external URLs.
 
## Prerequisites
 
- Node.js **20+**
- npm **9+** (npm workspaces)
 
## Quick start (local dev)
 
### 1) Install dependencies (workspace root)
 
```bash
npm install
2) Server env (.env in repo root)
Copy the example and adjust as needed:

cp server/.env.example .env
Notes:

The server reads env from the repo root .env.
PORT defaults to 8080 in code if you don’t set it.
3) Client env (client/.env.local)
Create client/.env.local (this repo does not include a client env example):

# Firebase Web App config (required for the UI auth flow)
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_APP_ID=...
 
# Optional: enables Firebase Analytics if provided
VITE_FIREBASE_MEASUREMENT_ID=...
 
# Optional but recommended for local dev:
# Use a full URL to your backend (especially if your server isn't proxied behind Vite).
VITE_API_URL=http://localhost:8080/api/v1
If you set PORT=3000 in .env, then set:

VITE_API_URL=http://localhost:3000/api/v1
4) Validate server env values
npm run env:check -w server
5) Run client + server together
npm run dev
Default URLs:

Client: http://localhost:5173
Server: http://localhost:8080
Health: http://localhost:8080/api/health
Build + run (production-style)
Build all workspaces:

npm run build
Run the API:

npm run start -w server
Preview the built client (Vite preview):

npm run preview -w client
Authentication (how API requests work)
Most API endpoints require a Firebase Auth ID token:

The client signs users in via Firebase Auth (email/password, Google, GitHub).
The client attaches Authorization: Bearer <idToken> to API requests.
The server verifies tokens using Firebase Admin (server/src/middleware/auth.ts).
If Firebase Admin credentials are not configured on the server, authenticated endpoints will fail.

API overview
Base path: /api

Health

GET /api/health
v1

POST /api/v1/analyze (auth required)
POST /api/v1/generate-readme (auth required)
POST /api/v1/feedback (auth required; accepted but not persisted in this build)
GET /api/v1/history (auth required; Pro-tier storage)
GET /api/v1/history/analysis/:id (auth required)
GET /api/v1/history/readmes (auth required)
Environment variables (server)
The server validates env values in server/src/config/env.ts. Common ones:

Core

NODE_ENV (development | test | production)
PORT (default 8080)
CLIENT_ORIGIN (default http://localhost:5173)
REQUEST_TIMEOUT_MS (default 30000)
GitHub (optional)

GITHUB_TOKEN (for higher rate limits)
GITHUB_API_BASE_URL (default https://api.github.com)
GITHUB_CACHE_TTL_MS (default 300000)
Gemini (required for README generation)

GEMINI_API_KEY
GEMINI_MODEL (default gemini-1.5-flash)
Google Cloud Natural Language (optional; improves tone analysis)

Provide credentials via one of:
GOOGLE_APPLICATION_CREDENTIALS=/abs/path/to/service-account.json (ADC), or
GCP_SERVICE_ACCOUNT_JSON='{...}', or
GOOGLE_CLOUD_CREDENTIALS_JSON='{...}'
Project ID via one of:
GCP_PROJECT_ID=... or GOOGLE_CLOUD_PROJECT_ID=...
Firebase Admin / Firestore (required for auth + persistence features)

FIREBASE_PROJECT_ID=... (recommended)
Provide credentials via one of:
GOOGLE_APPLICATION_CREDENTIALS=/abs/path/to/service-account.json (ADC), or
FIREBASE_SERVICE_ACCOUNT_JSON='{...}', or
GCP_SERVICE_ACCOUNT_JSON='{...}'
Google Cloud setup (recommended for full functionality)
Gemini API key (Google AI Studio)
Create an API key in AI Studio
Set GEMINI_API_KEY
Optionally set GEMINI_MODEL (default is already set)
Cloud Natural Language API (tone analysis)
Enable Cloud Natural Language API in your GCP project
Provide credentials (see env section). If unavailable, the server falls back to a simpler keyword-based tone heuristic.
Firebase (Auth + Firestore)
Create/link a Firebase project
Enable Authentication providers you want (Email, Google, GitHub)
Enable Firestore (used for user records + history/README storage for Pro tier)
Create a service account key and configure Firebase Admin credentials on the server
Add Firebase Web App config to client/.env.local (VITE_FIREBASE_*)
Troubleshooting
UI can’t reach the API
Set VITE_API_URL in client/.env.local to http://localhost:<PORT>/api/v1.
CORS errors
Ensure CLIENT_ORIGIN matches your frontend URL (especially for port-forwarded/Codespaces URLs).
401s from the API
Endpoints require Authorization: Bearer <Firebase ID token>. Make sure Firebase Auth is configured on both client and server.
Scripts (workspace root)
npm run dev — starts server + client together
npm run build — builds shared, server, then client
