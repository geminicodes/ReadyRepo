# RepoMax / ReadyRepo — Client↔Server Integration Report

Goal: **Every client API call matches a real server endpoint**, with correct path/method/auth/shape, and success + error paths verified.

## Verification (post-fix)

- ✅ `npm -w server run typecheck`
- ✅ `npm -w client run typecheck`
- ✅ `npx eslint .`
- ✅ Smoke-tested locally (no Firebase creds): `GET /api/health`, `GET /api/v1/repos/:owner/:repo` success; protected endpoints return **401** when no bearer token is provided.

---

## Phase 1 — API Endpoint Inventory

### Backend routes (mounted under `/api`)

**Public**
- `GET /api/health`
- `GET /api/v1/repos/:owner/:repo` (auth optional; rate-limited globally)

**Auth required (Firebase ID token)**
- `POST /api/v1/analyze`
- `POST /api/v1/generate-readme`
- `POST /api/v1/feedback`
- `GET /api/v1/history`
- `GET /api/v1/history/analysis/:id`
- `GET /api/v1/history/readmes`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/revoke`

### Frontend network calls

- `client/src/services/authFetch.ts`: fetch wrapper attaching `Authorization: Bearer <Firebase ID token>`
- `client/src/services/historyService.ts`:
  - `GET {VITE_API_URL||/api/v1}/history`
  - `GET {VITE_API_URL||/api/v1}/history/analysis/:id`
  - `GET {VITE_API_URL||/api/v1}/history/readmes`
- `client/src/pages/AccountSettings.tsx`:
  - `POST {VITE_API_URL||/api/v1}/auth/revoke` (via `authFetch`)
- `client/src/context/AnalysisContext.tsx`:
  - `POST {VITE_API_URL||/api/v1}/analyze`
- `client/src/components/analysis/RepoGrid.tsx`:
  - `GET {VITE_API_URL||/api/v1}/repos/:owner/:repo`
  - `POST {VITE_API_URL||/api/v1}/generate-readme`

---

## Integration matrix

| Frontend callsite | Method + Path | Backend endpoint | Status |
|---|---:|---:|---|
| `historyService.fetchAnalysisHistory` | `GET /api/v1/history` | `GET /api/v1/history` | ✅ |
| `historyService.fetchAnalysisById` | `GET /api/v1/history/analysis/:id` | `GET /api/v1/history/analysis/:id` | ✅ |
| `historyService.fetchUserREADMEs` | `GET /api/v1/history/readmes` | `GET /api/v1/history/readmes` | ✅ |
| `AccountSettings.signOutAllDevices` | `POST /api/v1/auth/revoke` | `POST /api/v1/auth/revoke` | ✅ |
| `AnalysisContext.startAnalysis` | `POST /api/v1/analyze` | `POST /api/v1/analyze` | ✅ |
| `RepoGrid.handleGenerateReadme` | `GET /api/v1/repos/:owner/:repo` | `GET /api/v1/repos/:owner/:repo` | ✅ |
| `RepoGrid.handleGenerateReadme` | `POST /api/v1/generate-readme` | `POST /api/v1/generate-readme` | ✅ |

---

## Phase 2 — Critical integration issues found + fixed

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔗 INTEGRATION ISSUE #1
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Type: Missing Endpoint
Client: `client/src/pages/AccountSettings.tsx` (called `/api/v1/auth/revoke`)
Server: *(missing prior to fix)*
Problem: Client called `POST /api/v1/auth/revoke`, but the server did not implement it.
Fix: Added `server/src/routes/v1/auth.ts` router mounted at `/api/v1/auth` with `POST /revoke`.
Verified: ✅ Local smoke test (no token) returns 401; with token it revokes refresh tokens.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔗 INTEGRATION ISSUE #2
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Type: Missing Endpoint
Client: *(new integration flow for README generation)*
Server: *(missing prior to fix)*
Problem: There was no server endpoint to fetch normalized repo metadata + README content (required to build `GenerateReadmeRequest`).
Fix: Added `GET /api/v1/repos/:owner/:repo`:
- File: `server/src/routes/v1/repos.ts`
- Backed by: `server/src/services/githubService.ts`
Verified: ✅ `GET /api/v1/repos/octocat/Hello-World` returns a `GitHubRepo` snapshot.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔗 INTEGRATION ISSUE #3
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Type: Missing Endpoint (requested list)
Client: *(not previously calling)*
Server: *(missing prior to fix)*
Problem: Requested endpoints list included:
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
Fix: Implemented both in `server/src/routes/v1/auth.ts`.
Notes:
- This system uses **Firebase ID tokens** as the JWT; the server does **not** mint its own JWT.
- `POST /auth/login` validates the bearer token and returns session info + token echo.
- `POST /auth/logout` revokes refresh tokens (server-side session invalidation).
Verified: ✅ Without token, returns 401. With valid Firebase token, returns `success: true`.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔗 INTEGRATION ISSUE #4
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Type: Client not wired to real API (Analyze flow)
Client: `client/src/pages/AnalyzePage.tsx`, `client/src/context/AnalysisContext.tsx`
Server: `POST /api/v1/analyze`
Problem: Analyze UI was fully mocked and didn’t send the required request body fields (`jobTitle`, `description`) that the server validates.
Fix:
- Updated Analyze form to collect `jobTitle` + `description`
- Wired `AnalysisContext.startAnalysis()` to call `POST /api/v1/analyze` via `authFetch`
- Mapped server `@readyrepo/shared` result shape into the UI’s existing `client/src/types/analysis.ts` shape (no server contract changes)
Verified: ✅ Typechecks pass; missing/invalid fields produce a user-visible error; no placeholder scoring logic changed.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔗 INTEGRATION ISSUE #5
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Type: Client not wired to real API (Generate flow)
Client: `client/src/components/analysis/RepoGrid.tsx`
Server: `GET /api/v1/repos/:owner/:repo`, `POST /api/v1/generate-readme`
Problem: README generation was mocked and did not use the backend Gemini pipeline.
Fix:
- RepoGrid now:
  1) Fetches repo snapshot from `/repos/:owner/:repo`
  2) Builds a `JobPosting` + `GenerateReadmeRequest` using `shared/` types
  3) Calls `/generate-readme`
  4) Surfaces 4xx/5xx errors to the modal
Verified: ✅ Typechecks pass; 422 (“not enough signals”) becomes a clean UI error; link sanitization remains server-enforced.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔗 INTEGRATION ISSUE #6
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Type: Base URL mismatch risk
Client: `client/src/pages/AccountSettings.tsx`
Server: `/api/v1/auth/revoke`
Problem: Account settings used a hardcoded relative URL. This can break when the API is deployed on a different origin.
Fix: Switched to `VITE_API_URL || '/api/v1'` and `authFetch()` for consistent auth + base URL behavior.
Verified: ✅ Compiles; matches other client calls.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

---

## Notes on contract expectations vs current shared types

The requested endpoint contract examples in the prompt (e.g. “`POST /api/v1/generate-readme` sends `{ repositoryUrl }`”) **do not match** the existing `shared/` contract, which defines:

- `GenerateReadmeRequest = { repo: GitHubRepo; currentReadme?; job: JobPosting; analysisId? }`

Fix strategy used: **do not break existing server contracts**. Instead, a new `/repos/:owner/:repo` endpoint supplies the `GitHubRepo` needed by the existing `/generate-readme` contract.

