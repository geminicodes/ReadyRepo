import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BadgeCheck,
  Camera,
  Crown,
  Loader2,
  Mail,
  Shield,
  Trash2,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { auth } from "@/config/firebase";
import { authFetch } from "@/services/authFetch";
import {
  deleteUser,
  sendEmailVerification,
  updatePassword,
  updateProfile,
} from "firebase/auth";
import { useRateLimit } from "@/hooks/use-rate-limit";
import { friendlyFirebaseAuthError } from "@/lib/firebaseAuthErrors";

function initials(name?: string | null, email?: string | null) {
  const base = (name || "").trim() || (email || "").trim();
  if (!base) return "?";
  const parts = base.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

export default function AccountSettings() {
  const { user, tier, resetPassword, getIdToken, signOut } = useAuth();
  const { snapshot } = useRateLimit();
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [photoUrl, setPhotoUrl] = useState(user?.photoURL ?? "");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const avatarFallback = useMemo(() => initials(user?.displayName, user?.email), [user?.displayName, user?.email]);

  if (!user) return null;

  const tierBadge =
    tier === "pro" ? (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-gradient-to-r from-cyan-400/20 to-pink-500/20 border border-white/10">
        <Crown className="w-3 h-3 text-yellow-400" aria-hidden="true" />
        Pro
      </span>
    ) : (
      <span className="text-xs px-2 py-0.5 rounded-full bg-muted/40 border border-border text-muted-foreground">
        Free
      </span>
    );

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      await updateProfile(auth.currentUser!, {
        displayName: displayName.trim() || null,
        photoURL: photoUrl.trim() || null,
      });
      toast({ title: "Profile updated" });
    } catch (e) {
      toast({
        title: "Couldn’t update profile",
        description: friendlyFirebaseAuthError(e),
        variant: "destructive",
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const sendVerify = async () => {
    try {
      await sendEmailVerification(auth.currentUser!);
      toast({ title: "Verification email sent", description: "Check your inbox." });
    } catch (e) {
      toast({
        title: "Couldn’t send verification",
        description: friendlyFirebaseAuthError(e),
        variant: "destructive",
      });
    }
  };

  const savePassword = async () => {
    if (newPassword.length < 8) {
      toast({ title: "Password must be 8+ characters", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }
    setSavingPassword(true);
    try {
      await updatePassword(auth.currentUser!, newPassword);
      setNewPassword("");
      setConfirmPassword("");
      toast({ title: "Password updated" });
    } catch (e) {
      toast({
        title: "Couldn’t update password",
        description: friendlyFirebaseAuthError(e),
        variant: "destructive",
      });
    } finally {
      setSavingPassword(false);
    }
  };

  const signOutAllDevices = async () => {
    try {
      const base = (import.meta.env.VITE_API_URL || "/api/v1").replace(/\/+$/, "");
      const res = await authFetch(`${base}/auth/revoke`, { method: "POST" });
      if (!res.ok) throw new Error("not-supported");
      await signOut();
      toast({ title: "Signed out everywhere" });
    } catch {
      toast({
        title: "Not available yet",
        description: "Sign out all devices requires a backend endpoint.",
      });
    }
  };

  const doDelete = async () => {
    setDeleting(true);
    try {
      await deleteUser(auth.currentUser!);
      toast({ title: "Account deleted" });
    } catch (e) {
      toast({
        title: "Couldn’t delete account",
        description: friendlyFirebaseAuthError(e),
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 animated-grid opacity-30" />
      <div className="fixed inset-0 bg-gradient-mesh pointer-events-none" />

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">Account Settings</h1>
              <p className="text-muted-foreground mt-2">Manage your profile, security, and plan.</p>
            </div>
            <div className="flex items-center gap-2">
              {tierBadge}
            </div>
          </div>
        </motion.div>

        <div className="space-y-6">
          {/* Profile */}
          <Card className="glass border-white/10 bg-background/60 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-primary" />
                Profile
              </CardTitle>
              <CardDescription>Update your public profile information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center gap-4">
                <div className={tier === "pro" ? "rounded-full p-[2px] bg-gradient-to-br from-cyan-400 to-pink-500" : ""}>
                  <Avatar className="h-14 w-14 bg-background">
                    <AvatarImage src={user.photoURL ?? undefined} alt={user.displayName ?? "User avatar"} />
                    <AvatarFallback className="font-medium">{avatarFallback}</AvatarFallback>
                  </Avatar>
                </div>
                <div className="min-w-0">
                  <div className="font-medium truncate">{user.displayName || "No display name"}</div>
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{user.email ?? "No email"}</span>
                    {user.emailVerified ? (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                        <BadgeCheck className="w-3 h-3" />
                        Verified
                      </span>
                    ) : (
                      <Button size="sm" variant="outline" onClick={sendVerify}>
                        Verify email
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium" htmlFor="settings-displayName">
                    Display name
                  </label>
                  <Input
                    id="settings-displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium" htmlFor="settings-photoUrl">
                    Photo URL
                  </label>
                  <Input
                    id="settings-photoUrl"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    placeholder="https://..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Tip: use a hosted image URL (GitHub, Gravatar, etc.).
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <Button variant="hero" onClick={saveProfile} disabled={savingProfile}>
                  {savingProfile ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save changes"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tier */}
          <Card className="glass border-white/10 bg-background/60 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-yellow-400" />
                Plan
              </CardTitle>
              <CardDescription>Your current plan and usage.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{tier === "pro" ? "Pro" : "Free"}</span>
                  {tierBadge}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {tier === "pro"
                    ? "Unlimited analyses and full history."
                    : `${snapshot.remaining ?? 0} analyses remaining this month.`}
                </div>
              </div>
              {tier === "free" ? (
                <Link to="/upgrade">
                  <Button variant="hero">Upgrade to Pro</Button>
                </Link>
              ) : null}
            </CardContent>
          </Card>

          {/* Security */}
          <Card className="glass border-white/10 bg-background/60 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Security
              </CardTitle>
              <CardDescription>Keep your account secure.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium" htmlFor="settings-newPassword">
                    New password
                  </label>
                  <Input
                    id="settings-newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium" htmlFor="settings-confirmPassword">
                    Confirm
                  </label>
                  <Input
                    id="settings-confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={async () => {
                    if (!user.email) return;
                    try {
                      await resetPassword(user.email);
                      toast({ title: "Reset link sent", description: "Check your email." });
                    } catch (e) {
                      toast({
                        title: "Couldn’t send reset link",
                        description: friendlyFirebaseAuthError(e),
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  Send reset email
                </Button>
                <Button variant="hero" onClick={savePassword} disabled={savingPassword}>
                  {savingPassword ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Change password"
                  )}
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={signOutAllDevices}>
                  Sign out all devices
                </Button>
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      await signOut();
                      toast({ title: "Signed out" });
                    } catch (e) {
                      toast({
                        title: "Sign out failed",
                        description: friendlyFirebaseAuthError(e),
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  Sign out
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Danger */}
          <Card className="glass border-white/10 bg-background/60 backdrop-blur-xl border-destructive/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="w-5 h-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>Delete your account and permanently remove access.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-4 flex-wrap">
              <div className="text-sm text-muted-foreground">
                This can’t be undone. You may need to sign in again to confirm.
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={deleting}>
                    {deleting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      "Delete account"
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete account?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This permanently deletes your account. If you used Google/GitHub sign-in, you can always create a new account later.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={doDelete}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

