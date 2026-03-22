type FirebaseAuthErrorLike = {
  code?: string;
  message?: string;
};

const FRIENDLY: Record<string, string> = {
  "auth/email-already-in-use": "Email already registered. Sign in instead.",
  "auth/invalid-email": "Please enter a valid email address.",
  "auth/weak-password": "Password must be 8+ characters.",
  "auth/user-not-found": "No account with this email.",
  "auth/wrong-password": "Incorrect password. Try reset.",
  "auth/invalid-credential": "Incorrect email or password.",
  "auth/too-many-requests":
    "Too many attempts. Please wait a bit and try again.",
  "auth/network-request-failed":
    "Network error. Check your connection and try again.",
  "auth/popup-closed-by-user": "Sign-in popup was closed before completing.",
  "auth/cancelled-popup-request": "Sign-in popup was cancelled. Please try again.",
  "auth/popup-blocked":
    "Popup was blocked by your browser. Allow popups and try again.",
  "auth/requires-recent-login":
    "For security, please sign in again and retry this action.",
  "auth/user-disabled": "This account has been disabled.",
};

export function friendlyFirebaseAuthError(err: unknown) {
  const e = err as FirebaseAuthErrorLike | null | undefined;
  const code = e?.code ?? "";
  if (code && FRIENDLY[code]) return FRIENDLY[code];
  return "Something went wrong. Please try again.";
}

export function firebaseAuthErrorCode(err: unknown) {
  const e = err as FirebaseAuthErrorLike | null | undefined;
  return e?.code ?? null;
}
