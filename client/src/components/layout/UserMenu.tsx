import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Crown, LogOut, Settings, FileText, History, Sparkles } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { SignInModal } from "@/components/auth/SignInModal";
import { SignUpModal } from "@/components/auth/SignUpModal";
import { toast } from "@/hooks/use-toast";

function initials(name?: string | null, email?: string | null) {
  const base = (name || "").trim() || (email || "").trim();
  if (!base) return "?";
  const parts = base.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

export function UserMenu() {
  const { user, tier, signOut } = useAuth();
  const [signInOpen, setSignInOpen] = useState(false);
  const [signUpOpen, setSignUpOpen] = useState(false);

  const displayName = user?.displayName ?? user?.email ?? "Account";
  const fallback = useMemo(() => initials(user?.displayName, user?.email), [user?.displayName, user?.email]);
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

  if (!user) {
    return (
      <>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => setSignInOpen(true)}>
            Sign In
          </Button>
          <Button variant="hero" onClick={() => setSignUpOpen(true)}>
            Sign Up
          </Button>
        </div>

        <SignInModal
          open={signInOpen}
          onOpenChange={setSignInOpen}
          onSwitchToSignUp={() => setSignUpOpen(true)}
          redirectTo="/analyze"
        />
        <SignUpModal
          open={signUpOpen}
          onOpenChange={setSignUpOpen}
          onSwitchToSignIn={() => setSignInOpen(true)}
          redirectTo="/analyze"
        />
      </>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={[
              "rounded-full p-[2px] focus:outline-none focus:ring-2 focus:ring-ring",
              tier === "pro" ? "bg-gradient-to-br from-cyan-400 to-pink-500" : "bg-border",
            ].join(" ")}
            aria-label="Open user menu"
          >
            <Avatar className="h-9 w-9 bg-background">
              <AvatarImage src={user.photoURL ?? undefined} alt={user.displayName ?? "User avatar"} />
              <AvatarFallback className="text-xs font-medium">{fallback}</AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="space-y-1">
            <div className="flex items-center justify-between gap-3">
              <span className="truncate">{displayName}</span>
              {tierBadge}
            </div>
            {user.email ? (
              <div className="text-xs text-muted-foreground truncate">{user.email}</div>
            ) : null}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem asChild>
            <Link to="/history" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              My Analyses
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/readmes" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Saved READMEs
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem asChild>
            <Link to="/settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Account Settings
            </Link>
          </DropdownMenuItem>

          {tier === "free" ? (
            <DropdownMenuItem asChild>
              <Link to="/upgrade" className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Upgrade to Pro
              </Link>
            </DropdownMenuItem>
          ) : null}

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={async () => {
              try {
                await signOut();
                toast({ title: "Signed out" });
              } catch {
                toast({ title: "Sign out failed", variant: "destructive" });
              }
            }}
            className="text-destructive focus:text-destructive"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <SignInModal
        open={signInOpen}
        onOpenChange={setSignInOpen}
        onSwitchToSignUp={() => setSignUpOpen(true)}
        redirectTo="/analyze"
      />
      <SignUpModal
        open={signUpOpen}
        onOpenChange={setSignUpOpen}
        onSwitchToSignIn={() => setSignInOpen(true)}
        redirectTo="/analyze"
      />
    </>
  );
}

