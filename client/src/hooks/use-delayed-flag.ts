import { useEffect, useState } from "react";

/**
 * Prevents loading-state "flash" by delaying a true value.
 * - When `flag` becomes true, `delayed` becomes true only after `delayMs`.
 * - When `flag` becomes false, `delayed` becomes false immediately.
 */
export function useDelayedFlag(flag: boolean, delayMs = 200) {
  const [delayed, setDelayed] = useState(false);

  useEffect(() => {
    if (!flag) {
      // Make this async to satisfy strict hook lint rules and avoid
      // synchronous setState-in-effect warnings.
      const t = window.setTimeout(() => setDelayed(false), 0);
      return () => window.clearTimeout(t);
    }

    const t = window.setTimeout(() => setDelayed(true), Math.max(0, delayMs));
    return () => window.clearTimeout(t);
  }, [flag, delayMs]);

  return delayed;
}

