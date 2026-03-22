import admin from "firebase-admin";
import { getEnv } from "./env";

let initialized = false;

function isRecord(v: unknown): v is Record<string, unknown> {
  return Boolean(v) && typeof v === "object" && !Array.isArray(v);
}

export function initializeFirebase() {
  if (initialized) return;

  const env = getEnv();
  const raw = env.FIREBASE_SERVICE_ACCOUNT_JSON ?? env.GCP_SERVICE_ACCOUNT_JSON ?? undefined;

  if (!raw) {
    // Fall back to Application Default Credentials if configured.
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: env.FIREBASE_PROJECT_ID ?? env.GOOGLE_CLOUD_PROJECT_ID ?? env.GCP_PROJECT_ID
    });
    initialized = true;
    return;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Invalid FIREBASE_SERVICE_ACCOUNT_JSON: must be valid JSON.");
  }

  if (!isRecord(parsed)) {
    throw new Error("Invalid FIREBASE_SERVICE_ACCOUNT_JSON: must be a JSON object.");
  }

  admin.initializeApp({
    credential: admin.credential.cert(parsed as admin.ServiceAccount),
    projectId:
      env.FIREBASE_PROJECT_ID ??
      (typeof parsed["project_id"] === "string" ? parsed["project_id"] : undefined) ??
      env.GOOGLE_CLOUD_PROJECT_ID ??
      env.GCP_PROJECT_ID
  });

  initialized = true;
}

export function getAuth() {
  initializeFirebase();
  return admin.auth();
}

export function getFirestore() {
  initializeFirebase();
  return admin.firestore();
}

export { admin };

