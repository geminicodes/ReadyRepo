import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Mail } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { friendlyFirebaseAuthError } from "@/lib/firebaseAuthErrors";

const schema = z.object({
  email: z.string().email("Please enter a valid email."),
});

type FormValues = z.infer<typeof schema>;

export function PasswordResetModal({
  open,
  onOpenChange,
  defaultEmail,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultEmail?: string;
}) {
  const { resetPassword } = useAuth();
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: { email: defaultEmail ?? "" },
  });

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      await resetPassword(values.email);
      setSent(true);
      toast({
        title: "Reset link sent",
        description: "Check your email for instructions.",
      });
    } catch (e) {
      toast({
        title: "Couldn’t send reset link",
        description: friendlyFirebaseAuthError(e),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) setSent(false);
      }}
    >
      <DialogContent className="glass border-white/10 bg-background/60 backdrop-blur-xl sm:rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Reset your password</DialogTitle>
          <DialogDescription>We’ll email you a link to set a new password.</DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {sent ? (
            <motion.div
              key="sent"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="glass rounded-xl border border-white/10 p-4"
            >
              <p className="text-sm text-foreground font-medium">Check your email for instructions.</p>
              <p className="text-sm text-muted-foreground mt-1">
                If you don’t see it, check spam or try again in a minute.
              </p>
              <div className="mt-4 flex justify-end">
                <Button type="button" onClick={() => onOpenChange(false)}>
                  Done
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
              noValidate
            >
              <div className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor="reset-email">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="reset-email"
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

              <Button type="submit" variant="hero" className="w-full" disabled={submitting || !form.formState.isValid}>
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </Button>
            </motion.form>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

