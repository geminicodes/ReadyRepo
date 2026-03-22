import { useCallback, useMemo, useSyncExternalStore } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getAnalysisUsage, getRateLimitSnapshot } from "@/lib/rateLimit";

const UPDATE_EVENT = "repomax:usage:update";

export function emitUsageUpdate() {
  window.dispatchEvent(new Event(UPDATE_EVENT));
}

function subscribeUsage(callback: () => void) {
  window.addEventListener(UPDATE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(UPDATE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function useRateLimit() {
  const { user, tier } = useAuth();
  const uid = user?.uid ?? null;

  // Keep `used` synced with localStorage without "setState in effect" patterns.
  const used = useSyncExternalStore(
    subscribeUsage,
    () => getAnalysisUsage(uid),
    () => 0,
  );

  // Preserve the existing API: callers can trigger a refresh.
  const refresh = useCallback(() => {
    emitUsageUpdate();
  }, []);

  // `used` is intentionally referenced to trigger recomputation when local usage changes.
  const snapshot = useMemo(() => {
    void used;
    return getRateLimitSnapshot({ uid, tier });
  }, [uid, tier, used]);

  return { snapshot, refresh };
}

