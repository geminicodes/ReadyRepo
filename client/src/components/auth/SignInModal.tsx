import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, EyeOff, Github, Loader2, Mail, Lock } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { friendlyFirebaseAuthError } from "@/lib/firebaseAuthErrors";
import { PasswordResetModal } from "@/components/auth/PasswordResetModal";
import { useNavigate } from "react-router-dom";
import { safeInternalRedirect } from "@/lib/safeRedirect";

const LAST_EMAIL_KEY = "repomax:last_email";

const schema = z.object({
  email: z.string().email("Please enter a valid email."),
  password: z.string().min(1, "Password is required."),
});

type FormValues = z.infer<typeof schema>;

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
  const { signIn, signInWithGoogle, signInWithGitHub } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const [resetOpen, setResetOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LAST_EMAIL_KEY);
      if (saved && !form.getValues("email")) form.setValue("email", saved, { shouldValidate: true });
    } catch {
      // no-op
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSuccess = () => {
    onOpenChange(false);
    toast({
      title: "Welcome back",
      description: "You’re signed in.",
    });
    if (onSignedIn) return onSignedIn();
    navigate(safeInternalRedirect(redirectTo, "/analyze"), { replace: true });
  };

  const persistEmail = (email: string) => {
    try {
      localStorage.setItem(LAST_EMAIL_KEY, email);
    } catch {
      // no-op
    }
  };

  const onSubmit = async (values: FormValues) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      persistEmail(values.email);
      await signIn(values.email, values.password);
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

  const emailForReset = form.watch("email");

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="glass border-white/10 bg-background/60 backdrop-blur-xl sm:rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Sign in</DialogTitle>
            <DialogDescription>Use email/password or continue with OAuth.</DialogDescription>
          </DialogHeader>

          <motion.div
            key={shakeKey}
            initial={false}
            animate={{ x: [0, -8, 8, -6, 6, 0] }}
            transition={{ duration: 0.35 }}
          >
            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2"
                onClick={() => social(signInWithGoogle)}
                disabled={submitting}
                aria-label="Continue with Google"
              >
                <span className="h-4 w-4 rounded-sm bg-gradient-to-br from-cyan-400 to-pink-500" aria-hidden="true" />
                Continue with Google
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2"
                onClick={() => social(signInWithGitHub)}
                disabled={submitting}
                aria-label="Continue with GitHub"
              >
                <Github className="w-4 h-4" />
                Continue with GitHub
              </Button>
            </div>

            <div className="flex items-center gap-3 my-5">
              <div className="h-px bg-border flex-1" />
              <span className="text-xs text-muted-foreground">or</span>
              <div className="h-px bg-border flex-1" />
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <div className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor="signin-email">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="you@company.com"
                    className="pl-9"
                    autoComplete="email"
                    disabled={submitting}
                    {...form.register("email")}
                  />
                </div>
                <AnimatePresence>
                  {form.formState.errors.email?.message ? (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="text-xs text-destructive"
                    >
                      {form.formState.errors.email.message}
                    </motion.p>
                  ) : null}
                </AnimatePresence>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium" htmlFor="signin-password">
                    Password
                  </label>
                  <button
                    type="button"
                    className="text-xs text-primary hover:underline"
                    onClick={() => setResetOpen(true)}
                  >
                    Forgot password?
                  </button>
                </div>

                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="signin-password"
                    type={showPassword ? "text" : "password"}
                    className="pl-9 pr-10"
                    autoComplete="current-password"
                    disabled={submitting}
                    {...form.register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-ring"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                </div>

                <AnimatePresence>
                  {form.formState.errors.password?.message ? (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="text-xs text-destructive"
                    >
                      {form.formState.errors.password.message}
                    </motion.p>
                  ) : null}
                </AnimatePresence>
              </div>

              <Button type="submit" variant="hero" className="w-full" disabled={submitting || !form.formState.isValid}>
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>
          </motion.div>

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
        </DialogContent>
      </Dialog>

      <PasswordResetModal
        open={resetOpen}
        onOpenChange={setResetOpen}
        defaultEmail={emailForReset}
      />
    </>
  );
}

