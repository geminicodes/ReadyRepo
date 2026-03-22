import { auth } from "@/config/firebase";
import { signOut as firebaseSignOut } from "firebase/auth";

const REQUEST_TIMEOUT_MS = 10_000;
const MIN_FORCED_REFRESH_INTERVAL_MS = 60_000;
const AUTH_FAILURE_STATUSES = new Set([401, 403]);

let lastForcedRefreshAtMs = 0;
let forcedRefreshInFlight: Promise<string | null> | null = null;

function mergeAbortSignals(external?: AbortSignal | null) {
  const controller = new AbortController();
  const onAbort = () => controller.abort();
  if (external) {
    if (external.aborted) controller.abort();
    else external.addEventListener("abort", onAbort, { once: true });
  }
  return { controller, cleanup: () => external?.removeEventListener("abort", onAbort) };
}

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit, opts?: { attempt?: number }) {
  const attempt = opts?.attempt ?? 0;
  const method = (init.method ?? "GET").toUpperCase();
  const start = performance.now();

  const { controller, cleanup } = mergeAbortSignals(init.signal);
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const finalInit: RequestInit = { ...init, signal: controller.signal };

  try {
    const res = await fetch(input, finalInit);
    if (import.meta.env.DEV) {
      const ms = Math.round(performance.now() - start);
      // Avoid logging headers/bodies (tokens).
      console.debug(`[api] ${method} ${String(input)} -> ${res.status} (${ms}ms)`);
    }
    return res;
  } catch (err) {
    const isAbort = err instanceof DOMException && err.name === "AbortError";
    const retryableMethod = method === "GET" || method === "HEAD";
    const canRetry = retryableMethod && attempt < 1;

    if (import.meta.env.DEV) {
      const ms = Math.round(performance.now() - start);
      console.warn(`[api] ${method} ${String(input)} failed (${ms}ms)`, err);
    }

    if (canRetry && (isAbort || err instanceof TypeError)) {
      await new Promise((r) => setTimeout(r, 250));
      return fetchWithTimeout(input, init, { attempt: attempt + 1 });
    }

    throw err;
  } finally {
    window.clearTimeout(timeout);
    cleanup();
  }
}

async function forceRefreshIdTokenRateLimited(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;

  // Coalesce concurrent refreshes.
  if (forcedRefreshInFlight) return forcedRefreshInFlight;

  const now = Date.now();
  if (now - lastForcedRefreshAtMs < MIN_FORCED_REFRESH_INTERVAL_MS) {
    // Too soon to force refresh; fall back to cached token.
    return user.getIdToken().catch(() => null);
  }

  lastForcedRefreshAtMs = now;
  forcedRefreshInFlight = user
    .getIdToken(true)
    .catch(() => null)
    .finally(() => {
      forcedRefreshInFlight = null;
    });

  return forcedRefreshInFlight;
}

function clearClientStorageBestEffort() {
  try {
    localStorage.clear();
  } catch {
    // no-op
  }
  try {
    sessionStorage.clear();
  } catch {
    // no-op
  }
}

async function bestEffortSignOutForInvalidSession() {
  try {
    clearClientStorageBestEffort();
    await firebaseSignOut(auth);
  } catch {
    // no-op
  }
}

/**
 * Authenticated fetch:
 * - Injects `Authorization: Bearer <idToken>` on every request (if logged in)
 * - On 401/403, forces token refresh (rate-limited) and retries once
 * - If retry is still 401, signs out to force re-auth
 */
export async function authFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const token = await auth.currentUser?.getIdToken().catch(() => null);
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetchWithTimeout(input, { ...init, headers });
  if (!AUTH_FAILURE_STATUSES.has(res.status)) return res;

  // Retry once with a forced refresh (helps with expired/revoked tokens).
  const refreshed = await forceRefreshIdTokenRateLimited();
  if (!refreshed) {
    if (res.status === 401) await bestEffortSignOutForInvalidSession();
    return res;
  }

  const retryHeaders = new Headers(init.headers);
  retryHeaders.set("Authorization", `Bearer ${refreshed}`);
  const retry = await fetchWithTimeout(input, { ...init, headers: retryHeaders });

  if (retry.status === 401) await bestEffortSignOutForInvalidSession();
  return retry;
}

export function isUnauthorized(res: Response) {
  return res.status === 401;
}

