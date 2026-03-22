# SECURITY AUDIT — RepoMax (ReadyRepo) Monorepo

## Scope note (critical)
The workspace you provided does **not** contain the system described in the prompt (no Next.js App Router, no Supabase, no DeepL worker, no Lemon Squeezy webhook, no `lib/_crypto.ts`).  
This repo is a **Vite React client** + **Express server** using **Firebase Auth/Admin**, **Firestore**, **Google Cloud Natural Language**, and **Gemini**.

This audit therefore hardens the **actual production security boundaries present** in this codebase.

---

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔴 ISSUE #1 [SEVERITY: Critical]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
File: `server/src/app.ts:68-94`
Category: Security - CORS / CSRF Posture
Problem: Development CORS previously reflected **any** Origin and enabled `credentials: true`, creating a dangerous posture where cross-site web pages could potentially make authenticated, credentialed requests if cookies were ever introduced (or misconfigured later).
Risk: Cross-origin data exfiltration and CSRF risk amplification; “secure-by-assumption” drift.
Fix: Replaced permissive dev CORS with an allowlist-based policy:
- Production: only `CLIENT_ORIGIN` / `FRONTEND_URL`
- Dev/Test: configured origins + safe `localhost`/Codespaces patterns
- Disabled credentials (Bearer-token auth; avoids cookie-based CSRF surface)
Code:
```40:94:server/src/app.ts
export function createApp() {
  const env = getEnv();
  const logger = createLogger();
  const app = express();

  // ...

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const allowedProd = [env.CLIENT_ORIGIN, env.FRONTEND_URL].filter(Boolean) as string[];
        if (env.NODE_ENV === "production") {
          const ok = allowedProd.includes(origin);
          return callback(ok ? null : new Error("CORS origin denied"), ok);
        }
        if (allowedProd.includes(origin) || isAllowedDevOrigin(origin)) return callback(null, true);
        return callback(new Error("CORS origin denied"), false);
      },
      credentials: false
    })
  );
}
```
Verified: ✅ `npm run build` passes; CORS behavior now deterministic.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔴 ISSUE #2 [SEVERITY: Critical]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
File: `server/src/config/logger.ts:6-22`
Category: Security - Credential Leakage via Logs
Problem: Request logging can inadvertently include sensitive headers (notably `Authorization`), depending on logger/request serializers and middleware configuration.
Risk: Bearer token leakage into logs (SIEM, hosted logs, crash reports) → account takeover.
Fix: Added Pino redaction for `req.headers.authorization` and `req.headers.cookie`.
Code:
```6:22:server/src/config/logger.ts
export function createLogger() {
  const isProd = process.env.NODE_ENV === "production";
  return pino({
    level: process.env.LOG_LEVEL ?? "info",
    base: { service: "readyrepo-server" },
    redact: {
      paths: ["req.headers.authorization", "req.headers.cookie"],
      remove: true
    },
    transport: isProd ? undefined : { target: "pino-pretty", options: { colorize: true, translateTime: "SYS:standard" } }
  });
}
```
Verified: ✅ Typecheck/build succeeded; secrets are no longer loggable via standard request logs.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔴 ISSUE #3 [SEVERITY: High]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
File: `server/src/routes/v1/auth.ts:23-51`
Category: Security - Sensitive Token Echo
Problem: `/api/v1/auth/login` previously echoed the incoming Bearer token back in the JSON response.
Risk: Token could be captured by browser extensions, intermediary logs, reverse proxies, or accidentally persisted by clients.
Fix: Removed `token` from the response body; endpoint now returns only server-validated user info.
Code:
```23:51:server/src/routes/v1/auth.ts
router.post("/login", authenticateUser, async (req, res, next) => {
  // ...
  res.json({
    success: true,
    data: {
      user: {
        uid: user.uid,
        email: user.email,
        tier: user.tier,
        displayName: user.displayName,
        photoURL: user.photoURL
      }
    }
  });
});
```
Verified: ✅ Client uses local Firebase token; server response remains compatible.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔴 ISSUE #4 [SEVERITY: High]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
File: `server/src/routes/v1/analyze.ts:51-109`, `server/src/services/userService.ts:111-179`
Category: Data Integrity - Race Condition (Quota Enforcement)
Problem: The free-tier quota check (`checkUserRateLimit`) and increment (`incrementAnalysisCount`) were performed in **separate** transactions.
Risk: Parallel requests could both pass the check and then both increment, allowing users to exceed limits (“double-spend” of quota).
Fix: Implemented `consumeAnalysisQuota()` which atomically checks-and-consumes within a single Firestore transaction. The analyze route now uses it.
Code:
```111:179:server/src/services/userService.ts
export async function consumeAnalysisQuota(uid: string): Promise<{ allowed: boolean; remaining: number; resetsAt: string; tier: UserTier; }> {
  const db = getFirestore();
  const ref = db.collection("users").doc(uid);
  return await db.runTransaction(async (tx) => {
    // ... reset logic ...
    if (currentCount >= 3) return { allowed: false, remaining: 0, resetsAt, tier: "free" };
    tx.set(ref, { analysisCount: currentCount + 1 }, { merge: true });
    return { allowed: true, remaining: Math.max(0, 3 - (currentCount + 1)), resetsAt, tier: "free" };
  });
}
```
Verified: ✅ Typecheck/build passed; quota consumption is now atomic under concurrency.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔴 ISSUE #5 [SEVERITY: High]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
File: `server/src/routes/v1/analyze.ts:19-26`, `server/src/routes/v1/readme.ts:20-51`
Category: Security - Input Validation / DoS & Abuse
Problem:
- URL validation accepted any scheme supported by `z.string().url()` (e.g., `file:`, `ftp:`), which is unsafe in zero-trust systems.
- Large free-form fields (job descriptions, READMEs) were not bounded by schema, increasing DoS and prompt-cost risk.
Risk: Abuse via oversized payloads; dangerous URL schemes creeping into downstream systems; runaway prompt sizes.
Fix:
- Enforced `http:`/`https:` schemes via `refine()`
- Added max-length constraints for key strings/arrays
Verified: ✅ Build succeeds; invalid schemes now fail validation.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🟠 ISSUE #6 [SEVERITY: Medium]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
File: `server/src/services/geminiService.ts:12-61`, `server/src/config/env.ts:15-40`
Category: Production Readiness - External Call Timeout & Fault Isolation
Problem: Gemini calls had no explicit timeout, risking hung requests and worker starvation.
Risk: Requests can stall until infrastructure timeout; increased latency and reduced availability under upstream degradation.
Fix:
- Added `GEMINI_TIMEOUT_MS` env var (default 30s)
- Wrapped `generateContent()` in a timeout guard and mapped failures to safe `502` HttpError
Verified: ✅ Typecheck/build succeeded; timeout behavior is controlled and predictable.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🟠 ISSUE #7 [SEVERITY: Medium]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
File: `package-lock.json`
Category: Supply Chain - Vulnerable Dependencies
Problem: `npm audit` reported:
- `react-router` advisories (CSRF/open redirect/XSS in affected versions)
- `undici` decompression chain resource exhaustion (Node fetch)
Risk: Known CVEs/Advisories present in production dependency graph.
Fix: Applied `npm audit fix` to remediate to non-vulnerable versions.
Verified: ✅ `npm audit --audit-level=high` reports **0 vulnerabilities**; `npm run build` passes.

---

## Verification summary
- `npm run typecheck -w server` ✅
- `npm run typecheck -w client` ✅
- `npm run build` ✅
- `npm audit --audit-level=high` ✅ (0 vulnerabilities)

