import { useState } from "react";
import { motion } from "framer-motion";
import { Github, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { friendlyFirebaseAuthError } from "@/lib/firebaseAuthErrors";
import { useNavigate } from "react-router-dom";
import { safeInternalRedirect } from "@/lib/safeRedirect";

export function SignInModal({
  open,
  onOpenChange,
  onSwitchToSignUp,
  redirectTo,
  onSignedIn,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSwitchToSignUp?: () => void;
  redirectTo?: string;
  onSignedIn?: () => void;
}) {
  const navigate = useNavigate();
  const { signInWithGitHub } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);

  const onSuccess = () => {
    onOpenChange(false);
    toast({
      title: "Welcome back",
      description: "You’re signed in.",
    });
    if (onSignedIn) return onSignedIn();
    navigate(safeInternalRedirect(redirectTo, "/analyze"), { replace: true });
  };

  const social = async (fn: () => Promise<void>) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await fn();
      onSuccess();
    } catch (e) {
      setShakeKey((k) => k + 1);
      toast({
        title: "Sign in failed",
        description: friendlyFirebaseAuthError(e),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass border-white/10 bg-background/60 backdrop-blur-xl sm:rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Sign in</DialogTitle>
          <DialogDescription>Continue with GitHub to sign in or create an account.</DialogDescription>
        </DialogHeader>

        <motion.div
          key={shakeKey}
          initial={false}
          animate={{ x: [0, -8, 8, -6, 6, 0] }}
          transition={{ duration: 0.35 }}
        >
          <Button
            type="button"
            variant="hero"
            className="w-full gap-2"
            onClick={() => social(signInWithGitHub)}
            disabled={submitting}
            aria-label="Continue with GitHub"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Github className="w-4 h-4" />}
            Continue with GitHub
          </Button>

          {onSwitchToSignUp ? (
            <div className="mt-5 text-sm text-muted-foreground text-center">
              Don’t have an account?{" "}
              <button
                type="button"
                className="text-primary hover:underline font-medium"
                onClick={() => {
                  onOpenChange(false);
                  onSwitchToSignUp?.();
                }}
              >
                Sign up
              </button>
            </div>
          ) : null}
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

