import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { Github, Loader2, Mail, User as UserIcon } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { friendlyFirebaseAuthError } from "@/lib/firebaseAuthErrors";
import { getPasswordStrength } from "@/lib/passwordStrength";
import { useNavigate } from "react-router-dom";
import { safeInternalRedirect } from "@/lib/safeRedirect";

const schema = z
  .object({
    displayName: z.string().min(2, "Full name is required."),
    email: z.string().email("Please enter a valid email."),
    password: z.string().min(8, "Password must be 8+ characters."),
    confirmPassword: z.string().min(8, "Please confirm your password."),
    acceptTerms: z.boolean().refine((v) => v === true, { message: "Please accept the terms to continue." }),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

export function SignUpModal({
  open,
  onOpenChange,
  onSwitchToSignIn,
  redirectTo = "/analyze",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSwitchToSignIn?: () => void;
  redirectTo?: string;
}) {
  const navigate = useNavigate();
  const { signUp, signInWithGoogle, signInWithGitHub } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      displayName: "",
      email: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
  });

  const password = form.watch("password");
  const strength = useMemo(() => getPasswordStrength(password ?? ""), [password]);

  const strengthUi =
    strength.strength === "strong"
      ? { label: "Strong", color: "bg-emerald-500" }
      : strength.strength === "medium"
        ? { label: "Medium", color: "bg-yellow-500" }
        : { label: "Weak", color: "bg-red-500" };

  const onSuccess = () => {
    onOpenChange(false);
    toast({
      title: "Welcome to RepoMax",
      description: "Your account is ready. Let’s analyze your profile.",
    });
    navigate(safeInternalRedirect(redirectTo, "/analyze"), { replace: true });
  };

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      await signUp(values.email, values.password, values.displayName);
      onSuccess();
    } catch (e) {
      setShakeKey((k) => k + 1);
      toast({
        title: "Sign up failed",
        description: friendlyFirebaseAuthError(e),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const social = async (fn: () => Promise<void>) => {
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
          <DialogTitle className="font-display text-2xl">Create your account</DialogTitle>
          <DialogDescription>Start with a free plan. Upgrade anytime.</DialogDescription>
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
              <label className="text-sm font-medium" htmlFor="displayName">
                Full Name
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="displayName"
                  placeholder="Ada Lovelace"
                  className="pl-9"
                  autoComplete="name"
                  disabled={submitting}
                  {...form.register("displayName")}
                />
              </div>
              <AnimatePresence>
                {form.formState.errors.displayName?.message ? (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="text-xs text-destructive"
                  >
                    {form.formState.errors.displayName.message}
                  </motion.p>
                ) : null}
              </AnimatePresence>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="email">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
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
              <label className="text-sm font-medium" htmlFor="password">
                Password
              </label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                disabled={submitting}
                {...form.register("password")}
              />
              <div className="flex items-center justify-between gap-3">
                <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                  <div
                    className={["h-full transition-all", strengthUi.color].join(" ")}
                    style={{ width: `${Math.min(100, (strength.score / 4) * 100)}%` }}
                    aria-hidden="true"
                  />
                </div>
                <span className="text-xs text-muted-foreground w-16 text-right">{strengthUi.label}</span>
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

            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="confirmPassword">
                Confirm Password
              </label>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                disabled={submitting}
                {...form.register("confirmPassword")}
              />
              <AnimatePresence>
                {form.formState.errors.confirmPassword?.message ? (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="text-xs text-destructive"
                  >
                    {form.formState.errors.confirmPassword.message}
                  </motion.p>
                ) : null}
              </AnimatePresence>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-start gap-2">
                <Checkbox
                  id="acceptTerms"
                  checked={form.watch("acceptTerms")}
                  onCheckedChange={(v) => form.setValue("acceptTerms", v === true, { shouldValidate: true })}
                  disabled={submitting}
                  aria-label="Accept terms"
                />
                <label htmlFor="acceptTerms" className="text-sm text-muted-foreground leading-5">
                  I agree to the terms and privacy policy.
                </label>
              </div>
              <AnimatePresence>
                {form.formState.errors.acceptTerms?.message ? (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="text-xs text-destructive"
                  >
                    {form.formState.errors.acceptTerms.message}
                  </motion.p>
                ) : null}
              </AnimatePresence>
            </div>

            <Button type="submit" variant="hero" className="w-full" disabled={submitting || !form.formState.isValid}>
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create account"
              )}
            </Button>
          </form>
        </motion.div>

        <div className="mt-5 text-sm text-muted-foreground text-center">
          Already have an account?{" "}
          <button
            type="button"
            className="text-primary hover:underline font-medium"
            onClick={() => {
              onOpenChange(false);
              onSwitchToSignIn?.();
            }}
          >
            Sign in
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

