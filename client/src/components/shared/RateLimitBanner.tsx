import { useMemo, useState } from "react";
import { format } from "date-fns";
import { CheckCircle2, X, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useRateLimit } from "@/hooks/use-rate-limit";

function monthKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function RateLimitBanner({ className }: { className?: string }) {
  const { user } = useAuth();
  const { snapshot } = useRateLimit();
  const dismissKey = useMemo(
    () => `repomax:ratelimit:dismiss:${user?.uid ?? "anon"}:${monthKey()}`,
    [user?.uid],
  );
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(dismissKey) === "1";
    } catch {
      return false;
    }
  });

  if (dismissed) return null;

  const onDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(dismissKey, "1");
    } catch {
      // no-op
    }
  };

  if (snapshot.tier === "pro") {
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className={[
          "glass rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 flex items-center justify-between gap-3",
          className,
        ].filter(Boolean).join(" ")}
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" aria-hidden="true" />
          <span className="text-sm text-foreground">
            <span className="font-medium">Pro</span>: Unlimited analyses
          </span>
        </div>
        <button
          onClick={onDismiss}
          className="p-1 rounded-md hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </motion.div>
    );
  }

  const limit = snapshot.limit ?? 0;
  const remaining = snapshot.remaining ?? 0;
  const used = snapshot.used;
  const progress = limit > 0 ? Math.min(100, Math.max(0, (used / limit) * 100)) : 0;

  const tone =
    remaining === 0 ? "red" : remaining === 1 ? "yellow" : "green";

  const toneClasses =
    tone === "red"
      ? "border-red-500/20 bg-red-500/5"
      : tone === "yellow"
        ? "border-yellow-500/20 bg-yellow-500/5"
        : "border-emerald-500/20 bg-emerald-500/5";

  const barClass =
    tone === "red" ? "bg-red-500" : tone === "yellow" ? "bg-yellow-500" : "bg-emerald-500";

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={[
        "glass rounded-2xl border px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3",
        toneClasses,
        className,
      ].filter(Boolean).join(" ")}
      role="status"
      aria-live="polite"
    >
      <div className="flex-1">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" aria-hidden="true" />
            <span className="text-sm text-foreground">
              <span className="font-medium">{remaining}</span> analyses remaining this month
            </span>
          </div>
          <button
            onClick={onDismiss}
            className="p-1 rounded-md hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="mt-2">
          <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
            <div
              className={["h-full rounded-full transition-all", barClass].join(" ")}
              style={{ width: `${progress}%` }}
              aria-hidden="true"
            />
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {used}/{limit} used
            </span>
            {snapshot.resetsOn ? <span>Resets on {format(snapshot.resetsOn, "MMM d")}</span> : null}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Link to="/upgrade">
          <Button variant="hero" size="sm">
            Upgrade to Pro
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}

