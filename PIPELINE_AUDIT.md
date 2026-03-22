# PIPELINE AUDIT — Vistro Lite Translation Pipeline (Requested) vs RepoMax Workspace (Actual)

## Critical scope mismatch
The audit request references a Vistro Lite translation pipeline with these components:
- `lib/segmenter.ts`
- `translation_memory` table (hash-keyed cache)
- `translation_jobs` table (queue)
- `lib/translationWorker.ts` (worker/lease/locking)
- `lib/deeplClient.ts` (DeepL batching/retries/mock)
- Next.js API routes: `/api/translate`, `/api/webhooks/lemonsqueezy`
- Supabase integration (service role key, queue draining)

**None of these components exist in the current `/workspace` repository.**

### Evidence (repo search results)
- No `segmenter.ts` found anywhere.
- No `translationWorker.ts` / `translationWorker.js` found anywhere.
- No `deeplClient.ts` found anywhere.
- No Supabase usage (`createClient`, `supabase`, `translation_jobs`, `translation_memory`) found anywhere.

This workspace is a **Vite React client + Express server** (Firebase Auth/Admin, Firestore, Gemini/NL), not the translation system described.

## What I can and cannot verify

### ✅ Can verify in this repo
- API middleware ordering, logging redaction, request limits, auth correctness (Firebase ID token verification)
- Firestore transactional integrity patterns and race conditions (quota logic)
- Dependency vulnerabilities and build/typecheck readiness

### ❌ Cannot verify (missing implementation)
Because the pipeline code is not present, I cannot:
- Trace enqueue → segment → cache → DeepL → retry → complete
- Validate job locking (FOR UPDATE SKIP LOCKED / atomic claim)
- Validate resumability after crash (lease expiry / heartbeat / reclaim logic)
- Validate translation memory hashing, atomic upserts, collision strategy
- Validate DeepL 429 handling, Retry-After parsing, batching size constraints
- Run the self-verification protocol (mock mode, crash simulation, cache-hit checks)

## Required artifacts to perform the requested audit
Provide **any one** of the following (so the code actually exists in the workspace):
- The correct repository / branch containing the Vistro Lite pipeline, or
- A folder drop containing:
  - `lib/segmenter.ts`
  - `lib/deeplClient.ts`
  - `lib/translationWorker.ts`
  - API route handlers for enqueue and webhook verification
  - Supabase schema migrations for `translation_jobs`, `translation_memory` (and any dead-letter table)
  - Supabase RPC or SQL used for atomic job claim/reclaim (if applicable)

Once present, I will:
- Perform the full concurrency + fault-tolerance audit you described
- Implement: atomic job claim + lease expiry reclaim, per-segment progress persistence, bounded retries with backoff, partial batch commit, idempotent memory upsert, and structured lifecycle logging
- Produce an issue-by-issue report in your requested format, and run the crash/retry/mock verification steps.

