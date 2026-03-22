import { useEffect, useState } from "react";
import { WifiOff, Wifi } from "lucide-react";

export function OfflineBanner() {
  const [online, setOnline] = useState(() => {
    // `navigator.onLine` is best-effort; treat undefined as online.
    return typeof navigator !== "undefined" ? navigator.onLine !== false : true;
  });

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  if (online) return null;

  return (
    <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50 px-3">
      <div className="glass rounded-full border border-border px-4 py-2 flex items-center gap-2 text-sm">
        <WifiOff className="w-4 h-4 text-destructive" aria-hidden="true" />
        <span className="text-foreground">You’re offline.</span>
        <span className="text-muted-foreground hidden sm:inline">Some features may be unavailable.</span>
      </div>
    </div>
  );
}

