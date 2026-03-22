const FREE_MONTHLY_ANALYSIS_LIMIT = 3;

function monthId(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export type RateLimitSnapshot = {
  tier: "free" | "pro";
  limit: number | null;
  used: number;
  remaining: number | null;
  resetsOn: Date | null;
};

function storageKey(uid?: string | null) {
  return `repomax:usage:analyses:${uid ?? "anon"}:${monthId()}`;
}

export function getResetDate(d = new Date()) {
  // Match backend behavior (UTC month boundary).
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1, 0, 0, 0, 0));
}

export function getAnalysisUsage(uid?: string | null) {
  try {
    const raw = localStorage.getItem(storageKey(uid));
    const n = raw ? Number(raw) : 0;
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
  } catch {
    return 0;
  }
}

export function setAnalysisUsage(uid: string | null | undefined, used: number) {
  try {
    localStorage.setItem(storageKey(uid), String(Math.max(0, Math.floor(used))));
  } catch {
    // no-op
  }
}

export function incrementAnalysisUsage(uid?: string | null) {
  const used = getAnalysisUsage(uid);
  setAnalysisUsage(uid, used + 1);
  return used + 1;
}

export function getRateLimitSnapshot(opts: { uid?: string | null; tier: "free" | "pro" }): RateLimitSnapshot {
  if (opts.tier === "pro") {
    return {
      tier: "pro",
      limit: null,
      used: 0,
      remaining: null,
      resetsOn: null,
    };
  }

  const used = getAnalysisUsage(opts.uid);
  const remaining = Math.max(0, FREE_MONTHLY_ANALYSIS_LIMIT - used);
  return {
    tier: "free",
    limit: FREE_MONTHLY_ANALYSIS_LIMIT,
    used,
    remaining,
    resetsOn: getResetDate(),
  };
}

