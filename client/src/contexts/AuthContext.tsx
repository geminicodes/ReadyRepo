import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { User } from "firebase/auth";
import {
  createUserWithEmailAndPassword,
  getIdTokenResult,
  onIdTokenChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
} from "firebase/auth";
import { auth, githubProvider, googleProvider, trackEvent } from "@/config/firebase";
import { friendlyFirebaseAuthError } from "@/lib/firebaseAuthErrors";

type Tier = "free" | "pro";

const TOKEN_REFRESH_BUFFER_MS = 5 * 60_000; // refresh when <5 min remaining
const MIN_FORCED_REFRESH_INTERVAL_MS = 60_000; // rate limit: max 1 forced refresh/min

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  error: string | null;
  idToken: string | null;
  claims: Record<string, unknown> | null;
  tier: Tier;

  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithGitHub: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  getIdToken: () => Promise<string | null>;
  refreshIdToken: () => Promise<string | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function computeTierFromClaims(claims: Record<string, unknown> | null): Tier {
  const tier = claims?.tier;
  if (tier === "pro") return "pro";
  if (claims?.pro === true) return "pro";
  return "free";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [claims, setClaims] = useState<Record<string, unknown> | null>(null);
  const tokenExpMsRef = useRef<number | null>(null);
  const refreshTimerRef = useRef<number | null>(null);
  const mountedRef = useRef(true);
  const lastForcedRefreshAtMsRef = useRef(0);
  const forcedRefreshInFlightRef = useRef<Promise<string | null> | null>(null);

  const clearRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current) {
      window.clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  const scheduleRefresh = useCallback((expMs: number) => {
    clearRefreshTimer();

    // Refresh 5 minutes before expiry (min 30s from now)
    const now = Date.now();
    const target = Math.max(now + 30_000, expMs - 5 * 60_000);
    const delay = Math.max(1_000, target - now);
    refreshTimerRef.current = window.setTimeout(() => {
      // Best-effort forced refresh; rate-limited below.
      const u = auth.currentUser;
      if (!u) return;
      void (async () => {
        const now2 = Date.now();
        if (forcedRefreshInFlightRef.current) {
          await forcedRefreshInFlightRef.current;
          return;
        }
        if (now2 - lastForcedRefreshAtMsRef.current < MIN_FORCED_REFRESH_INTERVAL_MS) return;
        lastForcedRefreshAtMsRef.current = now2;
        forcedRefreshInFlightRef.current = u
          .getIdToken(true)
          .catch(() => null)
          .finally(() => {
            forcedRefreshInFlightRef.current = null;
          });
        await forcedRefreshInFlightRef.current;
      })();
    }, delay);
  }, [clearRefreshTimer]);

  const updateTokenState = useCallback(async (firebaseUser: User) => {
    const [token, tokenResult] = await Promise.all([
      firebaseUser.getIdToken(),
      getIdTokenResult(firebaseUser),
    ]);

    if (!mountedRef.current) return;

    setIdToken(token);
    setClaims((tokenResult.claims ?? {}) as Record<string, unknown>);
    tokenExpMsRef.current = tokenResult.expirationTime
      ? new Date(tokenResult.expirationTime).getTime()
      : null;

    if (tokenExpMsRef.current) scheduleRefresh(tokenExpMsRef.current);
  }, [scheduleRefresh]);

  useEffect(() => {
    mountedRef.current = true;
    setLoading(true);

    const unsub = onIdTokenChanged(auth, async (firebaseUser) => {
      setLoading(true);
      setError(null);

      clearRefreshTimer();

      try {
        if (!firebaseUser) {
          setUser(null);
          setIdToken(null);
          setClaims(null);
          tokenExpMsRef.current = null;
          return;
        }

        setUser(firebaseUser);
        await updateTokenState(firebaseUser);
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    });

    return () => {
      mountedRef.current = false;
      clearRefreshTimer();
      unsub();
    };
  }, [clearRefreshTimer, updateTokenState]);

  const clearClientStorage = useCallback(() => {
    // Requirement: clear storage on logout (best-effort; ignore browser restrictions).
    try {
      localStorage.clear();
    } catch {
      // no-op
    }
    try {
      sessionStorage.clear();
    } catch {
      // no-op
    }
  }, []);

  const signUp: AuthContextValue["signUp"] = useCallback(async (email, password, displayName) => {
    setError(null);
    await trackEvent("sign_up_started", { method: "password" });
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName) {
        await updateProfile(cred.user, { displayName });
      }
      await sendEmailVerification(cred.user).catch(() => undefined);
      await trackEvent("sign_up_completed", { method: "password" });
    } catch (e) {
      await trackEvent("sign_up_failed", { method: "password" });
      const msg = friendlyFirebaseAuthError(e);
      setError(msg);
      throw e;
    }
  }, []);

  const signIn: AuthContextValue["signIn"] = useCallback(async (email, password) => {
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      await trackEvent("sign_in_completed", { method: "password" });
    } catch (e) {
      await trackEvent("sign_in_failed", { method: "password" });
      const msg = friendlyFirebaseAuthError(e);
      setError(msg);
      throw e;
    }
  }, []);

  const signInWithGoogle: AuthContextValue["signInWithGoogle"] = useCallback(async () => {
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
      await trackEvent("sign_in_completed", { method: "google" });
      await trackEvent("sign_in_method", { method: "google" });
    } catch (e) {
      await trackEvent("sign_in_failed", { method: "google" });
      const msg = friendlyFirebaseAuthError(e);
      setError(msg);
      throw e;
    }
  }, []);

  const signInWithGitHub: AuthContextValue["signInWithGitHub"] = useCallback(async () => {
    setError(null);
    try {
      await signInWithPopup(auth, githubProvider);
      await trackEvent("sign_in_completed", { method: "github" });
      await trackEvent("sign_in_method", { method: "github" });
    } catch (e) {
      await trackEvent("sign_in_failed", { method: "github" });
      const msg = friendlyFirebaseAuthError(e);
      setError(msg);
      throw e;
    }
  }, []);

  const signOut: AuthContextValue["signOut"] = useCallback(async () => {
    setError(null);
    try {
      clearRefreshTimer();
      tokenExpMsRef.current = null;
      lastForcedRefreshAtMsRef.current = 0;
      forcedRefreshInFlightRef.current = null;
      if (mountedRef.current) {
        setUser(null);
        setIdToken(null);
        setClaims(null);
      }
      clearClientStorage();
      await firebaseSignOut(auth);
      await trackEvent("sign_out");
    } catch (e) {
      const msg = friendlyFirebaseAuthError(e);
      setError(msg);
      throw e;
    }
  }, [clearClientStorage, clearRefreshTimer]);

  const resetPassword: AuthContextValue["resetPassword"] = useCallback(async (email) => {
    setError(null);
    await trackEvent("password_reset_requested");
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (e) {
      const msg = friendlyFirebaseAuthError(e);
      setError(msg);
      throw e;
    }
  }, []);

  const getIdToken: AuthContextValue["getIdToken"] = useCallback(async () => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) return null;

    const exp = tokenExpMsRef.current;
    const now = Date.now();
    try {
      // If we have a token that's valid beyond our buffer, reuse it.
      if (idToken && exp && exp - now > TOKEN_REFRESH_BUFFER_MS) return idToken;

      // If within buffer (or exp unknown), best-effort forced refresh (rate-limited).
      const shouldForce = Boolean(exp && exp - now <= TOKEN_REFRESH_BUFFER_MS);
      if (shouldForce) {
        if (forcedRefreshInFlightRef.current) {
          const t = await forcedRefreshInFlightRef.current;
          if (t) {
            if (mountedRef.current) setIdToken(t);
            return t;
          }
        }

        const now2 = Date.now();
        if (now2 - lastForcedRefreshAtMsRef.current >= MIN_FORCED_REFRESH_INTERVAL_MS) {
          lastForcedRefreshAtMsRef.current = now2;
          forcedRefreshInFlightRef.current = firebaseUser
            .getIdToken(true)
            .catch(() => null)
            .finally(() => {
              forcedRefreshInFlightRef.current = null;
            });
          const t = await forcedRefreshInFlightRef.current;
          if (t) {
            if (mountedRef.current) setIdToken(t);
            return t;
          }
        }
      }

      const token = await firebaseUser.getIdToken();
      if (mountedRef.current) setIdToken(token);
      return token;
    } catch {
      return null;
    }
  }, [idToken]);

  const refreshIdToken: AuthContextValue["refreshIdToken"] = useCallback(async () => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) return null;
    try {
      if (forcedRefreshInFlightRef.current) {
        const token = await forcedRefreshInFlightRef.current;
        if (token && mountedRef.current) setIdToken(token);
        return token;
      }

      const now = Date.now();
      if (now - lastForcedRefreshAtMsRef.current < MIN_FORCED_REFRESH_INTERVAL_MS) {
        const token = await firebaseUser.getIdToken().catch(() => null);
        if (token && mountedRef.current) setIdToken(token);
        return token;
      }

      lastForcedRefreshAtMsRef.current = now;
      forcedRefreshInFlightRef.current = firebaseUser
        .getIdToken(true)
        .catch(() => null)
        .finally(() => {
          forcedRefreshInFlightRef.current = null;
        });

      const token = await forcedRefreshInFlightRef.current;
      if (!token) return null;

      // Update claims/exp/schedule based on the refreshed token.
      const tokenResult = await getIdTokenResult(firebaseUser).catch(() => null);
      if (mountedRef.current) {
        setIdToken(token);
        if (tokenResult?.claims) setClaims((tokenResult.claims ?? {}) as Record<string, unknown>);
      }
      tokenExpMsRef.current = tokenResult?.expirationTime
        ? new Date(tokenResult.expirationTime).getTime()
        : tokenExpMsRef.current;
      if (tokenExpMsRef.current) scheduleRefresh(tokenExpMsRef.current);

      return token;
    } catch {
      return null;
    }
  }, [scheduleRefresh]);

  const tier = useMemo(() => computeTierFromClaims(claims), [claims]);

  const value: AuthContextValue = useMemo(
    () => ({
      user,
      loading,
      error,
      idToken,
      claims,
      tier,
      signUp,
      signIn,
      signInWithGoogle,
      signInWithGitHub,
      signOut,
      resetPassword,
      getIdToken,
      refreshIdToken,
    }),
    [
      user,
      loading,
      error,
      idToken,
      claims,
      tier,
      signUp,
      signIn,
      signInWithGoogle,
      signInWithGitHub,
      signOut,
      resetPassword,
      getIdToken,
      refreshIdToken,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
