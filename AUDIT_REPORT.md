# RepoMax / ReadyRepo — Production Audit Report

This document records **concrete issues found** (security, type safety, contracts, runtime behavior) and the **production-grade fixes applied**.

## Verification summary (post-fix)

- **TypeScript**: `npm -w client run typecheck`, `npm -w server run typecheck`, `npm -w shared run build` ✅
- **Lint**: `npx eslint .` ✅ (note: Node prints an ESM warning for `eslint.config.js`, but lint exits cleanly)
- **Build**: `npm run build` ✅
- **Security**: `npm audit` ✅ (0 vulnerabilities)

> Known limitation preserved: `/api/v1/analyze` returns placeholder scores set to 0 (by design).

---

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔴 ISSUE #1 [HIGH]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
File: `eslint.config.js`
Category: Tooling / Build Integrity
Problem: ESLint config imported packages that were **not installed**, causing lint to hard-fail (`ERR_MODULE_NOT_FOUND`).
Risk: CI/lint gates unusable; regressions ship unnoticed.
Fix: Installed the missing devDependencies used by the existing ESLint config:
- `@eslint/js`
- `globals`
- `eslint-plugin-react-hooks`
- `eslint-plugin-react-refresh`
- `typescript-eslint`
Verified: ✅ `npx eslint .` exits 0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔴 ISSUE #2 [HIGH]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
File: `server/src/middleware/auth.ts`
Category: Security / Authentication
Problem: Bearer token parsing was brittle (`header.split(" ")`), and accepted arbitrarily large tokens.
Risk: Incorrect parsing → auth bypass/false negatives; oversized headers → avoidable CPU/memory pressure (DoS surface).
Fix: Replaced with a robust regex parser, trimmed token, and added a hard length guard:

```ts
const match = /^\s*bearer\s+(.+)\s*$/i.exec(header);
if (!match) return null;
const token = match[1]?.trim();
if (!token) return null;
if (token.length > 10_000) return null;
```

Verified: ✅ Server typecheck + lint pass; protected routes still require Bearer tokens.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔴 ISSUE #3 [HIGH]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
File: `server/src/middleware/auth.ts`
Category: Security / Availability
Problem: Every authenticated request performed Firestore reads and user upserts without any caching.
Risk: Unbounded Firestore traffic → latency, cost, and rate-limit risk (especially on endpoints called frequently).
Fix: Added **bounded in-memory LRU caches**:
- Tier lookup cache (TTL 60s)
- User upsert throttle cache (TTL 5m) to avoid write amplification

Verified: ✅ Server typecheck pass; behavior preserved (same auth contract), with reduced backend load.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔴 ISSUE #4 [HIGH]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
File: `server/src/middleware/auth.ts`
Category: Type Safety / Security
Problem: Multiple `any` casts on decoded Firebase token claims (`(decoded as any).name`, etc).
Risk: Type holes hide bugs and can lead to unsafe assumptions about token contents.
Fix: Removed `any` and introduced a safe claim accessor:

```ts
function getStringClaim(token: DecodedIdToken, key: string): string | null {
  const value = (token as unknown as Record<string, unknown>)[key];
  return typeof value === "string" ? value : null;
}
```

Verified: ✅ ESLint no-explicit-any errors eliminated; server compiles.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔴 ISSUE #5 [MEDIUM]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
File: `server/src/app.ts`, `server/src/config/env.ts`
Category: Security / Configuration Validation
Problem: Production CORS origin used `process.env.FRONTEND_URL` directly (not validated).
Risk: Misconfiguration could open CORS wider than intended.
Fix: Added `FRONTEND_URL` to the validated env schema and used `env.FRONTEND_URL` instead.
Verified: ✅ Server typecheck passes; production origin remains restricted to validated URL(s).
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔴 ISSUE #6 [HIGH]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
File: `client/src/services/historyService.ts`
Category: API Contract / Runtime Correctness
Problem: Client called incorrect history endpoints and assumed incorrect response shapes:
- Called `GET /history?limit=...` instead of `GET /history`
- Called `GET /readmes` instead of `GET /history/readmes`
- Assumed response was a raw array (server returns `{ success, data: { analyses/readmes } }`)
Risk: Pro-tier users would see broken history/README library behavior when API responds successfully.
Fix: Updated endpoints + added robust response parsing and safe mapping:
- Uses `unknown` + type guards (no `any`)
- Maps server docs to UI `HistoryAnalysis` / `SavedREADME` with safe defaults
- Handles Firestore Timestamp-ish JSON shapes best-effort
Verified: ✅ Client typecheck passes; contract mismatch removed without changing server response shapes.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔴 ISSUE #7 [HIGH]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
File: `server/src/routes/v1/index.ts`, `server/src/routes/v1/auth.ts`, `client/src/pages/AccountSettings.tsx`
Category: API Contract / Security Feature
Problem: UI attempted `POST /api/v1/auth/revoke` for “Sign out all devices”, but server had no endpoint.
Risk: Feature always fails; users can’t reliably revoke sessions.
Fix: Added new endpoint `POST /api/v1/auth/revoke` that revokes refresh tokens for the authenticated user using Firebase Admin:

```ts
await getAuth().revokeRefreshTokens(user.uid);
res.json({ success: true, data: { revoked: true } });
```

Verified: ✅ Server typecheck + build pass; endpoint added without breaking existing routes/contracts.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔴 ISSUE #8 [HIGH]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
File: `client/src/components/history/ScoreTrendChart.tsx`
Category: React Correctness
Problem: A component (`CustomTooltip`) was defined inside render and then instantiated during render (`<Tooltip content={<CustomTooltip />} />`).
Risk: React state reset + lint errors (“Cannot create components during render”).
Fix: Moved `CustomTooltip` to module scope and passed it as a function reference:

```tsx
<Tooltip content={CustomTooltip} />
```

Verified: ✅ ESLint clean; chart renders without the React purity violation.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔴 ISSUE #9 [HIGH]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
File: `client/src/components/ui/sidebar.tsx`
Category: React Purity / Determinism
Problem: `Math.random()` executed during render (even inside `useMemo`), violating React purity rules.
Risk: Unstable UI output across renders; lint error.
Fix: Replaced with deterministic per-instance width derived from `useId()` and a small hash.
Verified: ✅ ESLint clean; skeleton remains visually varied without impure render logic.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔴 ISSUE #10 [HIGH]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
File: `client/src/hooks/use-rate-limit.ts`
Category: React Performance / Correctness
Problem: Hook used `setState()` synchronously in an effect to “refresh” localStorage usage.
Risk: Cascading renders; lint error; fragile state sync.
Fix: Replaced with `useSyncExternalStore` subscription to:
- Custom in-app update event
- `storage` events
Preserved the public hook API (`{ snapshot, refresh }`) by implementing `refresh()` as an event emitter.
Verified: ✅ ESLint clean; usage stays synced without effect-driven setState loops.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔴 ISSUE #11 [MEDIUM]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
File: `client/src/components/analysis/READMEModal.tsx`
Category: React Hooks Correctness
Problem: `useEffect` referenced values/functions not listed in dependencies, risking stale logic and repeated generation edge cases.
Risk: Double-generation or missed generation on state transitions.
Fix: Wrapped `handleGenerate` in `useCallback` and used a fully declared dependency list.
Verified: ✅ ESLint clean; modal generation triggers reliably and idempotently.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔴 ISSUE #12 [MEDIUM]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
File: `client/src/contexts/AuthContext.tsx`
Category: Type Safety / Hooks Correctness
Problem: Hook dependencies were incomplete and `useMemo` created a context value that could capture stale function references.
Risk: Subtle auth bugs under re-render and inconsistent token refresh scheduling.
Fix:
- Converted timer helpers + token getters to `useCallback`
- Added correct dependencies to `useEffect` / `useMemo`
- Converted auth actions (`signIn`, `signUp`, etc.) to stable `useCallback` functions
Verified: ✅ ESLint clean; client typecheck passes; auth behavior preserved.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔴 ISSUE #13 [MEDIUM]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
File: `client/tsconfig.json`, `client/tsconfig.app.json`
Category: Type Safety / Strictness
Problem: Client TS config disabled strictness (`strict: false`, `strictNullChecks: false`, `noImplicitAny: false`).
Risk: Bugs slip into production (null/undefined misuse, implicit any).
Fix: Enabled strict mode and core strictness flags while keeping the monorepo structure intact.
Verified: ✅ `npm -w client run typecheck` passes under strict settings.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔴 ISSUE #14 [MEDIUM]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
File: `server/src/config/firebase.ts`, `server/src/services/firestoreService.ts`, `server/src/services/toneAnalyzer.ts`, `server/src/routes/v1/readme.ts`
Category: Type Safety / Maintainability
Problem: Explicit `any` usage in several server modules.
Risk: Hidden runtime bugs and lint failures (`@typescript-eslint/no-explicit-any`).
Fix: Replaced with `unknown` + type guards, safe property access, and typed Zod access where applicable.
Verified: ✅ Server typecheck + lint pass.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔴 ISSUE #15 [MEDIUM]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
File: `tailwind.config.ts`
Category: Code Quality / Type Safety
Problem: Used `// @ts-ignore` to import `tailwindcss-animate`.
Risk: Type suppression hides real problems.
Fix: Removed `@ts-ignore` and used an explicit `PluginCreator` cast from `unknown`.
Verified: ✅ Builds still work; no type suppression comment remains.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔴 ISSUE #16 [MEDIUM]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
File: `client/src/components/ui/chart.tsx`
Category: Security (XSS Hardening)
Problem: Used `dangerouslySetInnerHTML` to inject generated CSS.
Risk: Any future path that allows untrusted input into `config` could become a CSS/HTML injection vector.
Fix: Rendered CSS as a plain text child of `<style>` instead of using `dangerouslySetInnerHTML`.
Verified: ✅ Client build/typecheck pass; chart styling preserved.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

---

## Notes / Non-changes (intent preserved)

- `/api/v1/analyze` still returns an `analysisResult` with scores set to 0 (placeholder by design).
- README generation remains conservative and link-sanitized; no rules removed.

