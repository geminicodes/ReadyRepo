import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, GithubAuthProvider } from "firebase/auth";
import { getAnalytics, isSupported, logEvent, type Analytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: (import.meta.env.VITE_FIREBASE_API_KEY as string | undefined) ?? "",
  authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined) ?? "",
  projectId: (import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined) ?? "",
  appId: (import.meta.env.VITE_FIREBASE_APP_ID as string | undefined) ?? "",
  // Optional (enables Analytics if provided)
  measurementId: (import.meta.env.VITE_FIREBASE_MEASUREMENT_ID as string | undefined) ?? "",
};

const hasFirebaseClientConfig =
  Boolean(firebaseConfig.apiKey) &&
  Boolean(firebaseConfig.authDomain) &&
  Boolean(firebaseConfig.projectId) &&
  Boolean(firebaseConfig.appId);

// If env vars are missing, initialize with a harmless placeholder config so the UI can still render.
// Auth operations will fail gracefully, but the landing/marketing UI remains usable.
const effectiveFirebaseConfig = hasFirebaseClientConfig
  ? firebaseConfig
  : {
      apiKey: "demo",
      authDomain: "demo.firebaseapp.com",
      projectId: "demo",
      appId: "1:1:web:demo",
    };

if (import.meta.env.DEV && !hasFirebaseClientConfig) {
  console.warn("[firebase] Missing VITE_FIREBASE_* env vars; running in UI-only mode.");
}

export const app = initializeApp(effectiveFirebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const githubProvider = new GithubAuthProvider();

let analyticsPromise: Promise<Analytics | null> | null = null;

async function getAnalyticsSafe() {
  // Only enable Analytics when configured AND Firebase config is real.
  if (!hasFirebaseClientConfig) return null;
  if (!firebaseConfig.measurementId) return null;
  if (!analyticsPromise) {
    analyticsPromise = isSupported()
      .then((supported) => (supported ? getAnalytics(app) : null))
      .catch(() => null);
  }
  return analyticsPromise;
}

export async function trackEvent(name: string, params?: Record<string, unknown>) {
  const analytics = await getAnalyticsSafe();
  if (!analytics) return;
  try {
    logEvent(analytics, name, params);
  } catch {
    // no-op
  }
}
