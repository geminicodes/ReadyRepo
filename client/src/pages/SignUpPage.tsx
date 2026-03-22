import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { Location } from "react-router-dom";
import { SignUpModal } from "@/components/auth/SignUpModal";
import { useAuth } from "@/contexts/AuthContext";
import { safeInternalRedirect } from "@/lib/safeRedirect";

type LocationState = { from?: Location };

export default function SignUpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(true);

  const from = useMemo(() => {
    const state = location.state as LocationState | null;
    const raw = state?.from?.pathname ? `${state.from.pathname}${state.from.search ?? ""}` : null;
    return safeInternalRedirect(raw, "/analyze");
  }, [location.state]);

  useEffect(() => {
    if (!loading && user) {
      navigate(from, { replace: true });
    }
  }, [loading, user, from, navigate]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 animated-grid opacity-20" />
      <div className="absolute inset-0 bg-gradient-mesh" />

      <SignUpModal
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) navigate("/", { replace: true });
        }}
        onSwitchToSignIn={() => navigate("/signin", { state: location.state })}
        redirectTo={from}
      />
    </div>
  );
}

