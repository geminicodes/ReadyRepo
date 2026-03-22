import type { RequestHandler } from "express";
import { LRUCache } from "lru-cache";
import type { DecodedIdToken } from "firebase-admin/auth";
import { HttpError } from "../errors/httpError";
import { getAuth, getFirestore } from "../config/firebase";
import { createOrUpdateUser } from "../services/userService";

function parseBearerToken(header: string | undefined) {
  if (!header) return null;
  const match = /^\s*bearer\s+(.+)\s*$/i.exec(header);
  if (!match) return null;
  const token = match[1]?.trim();
  if (!token) return null;
  // Guard against absurdly large headers (basic DoS hardening).
  if (token.length > 10_000) return null;
  return token;
}

function getStringClaim(token: DecodedIdToken, key: string): string | null {
  const value = (token as unknown as Record<string, unknown>)[key];
  return typeof value === "string" ? value : null;
}

const tierCache = new LRUCache<string, "free" | "pro">({
  max: 10_000,
  ttl: 60_000
});

const upsertCache = new LRUCache<string, true>({
  max: 10_000,
  ttl: 5 * 60_000
});

async function getUserTier(uid: string): Promise<"free" | "pro"> {
  const cached = tierCache.get(uid);
  if (cached) return cached;

  const db = getFirestore();
  const snap = await db.collection("users").doc(uid).get();
  const tier = (snap.exists ? (snap.data()?.tier as string | undefined) : undefined) ?? "free";
  const normalized = tier === "pro" ? "pro" : "free";
  tierCache.set(uid, normalized);
  return normalized;
}

export const authenticateUser: RequestHandler = async (req, _res, next) => {
  try {
    const token = parseBearerToken(req.header("authorization"));
    if (!token) {
      return next(
        new HttpError({
          statusCode: 401,
          publicMessage: "Authentication required.",
          internalMessage: "Missing bearer token"
        })
      );
    }

    const auth = getAuth();
    const decoded = await auth.verifyIdToken(token, true);

    // Ensure user exists/updated in Firestore (server-trusted fields).
    // Cache this lightly to avoid write amplification on high-traffic APIs.
    if (!upsertCache.get(decoded.uid)) {
      await createOrUpdateUser(
        decoded.uid,
        decoded.email ?? null,
        getStringClaim(decoded, "name"),
        getStringClaim(decoded, "picture")
      );
      upsertCache.set(decoded.uid, true);
    }

    const tier = await getUserTier(decoded.uid);

    req.user = {
      uid: decoded.uid,
      email: decoded.email ?? null,
      tier,
      displayName: getStringClaim(decoded, "name"),
      photoURL: getStringClaim(decoded, "picture")
    };

    req.log?.info({ uid: decoded.uid, tier }, "auth_ok");
    next();
  } catch (err) {
    req.log?.warn({ err }, "auth_failed");
    next(
      new HttpError({
        statusCode: 401,
        publicMessage: "Invalid or expired token.",
        internalMessage: "Token verification failed"
      })
    );
  }
};

export const optionalAuth: RequestHandler = async (req, _res, next) => {
  const token = parseBearerToken(req.header("authorization"));
  if (!token) return next();

  try {
    const auth = getAuth();
    const decoded = await auth.verifyIdToken(token, true);

    if (!upsertCache.get(decoded.uid)) {
      await createOrUpdateUser(
        decoded.uid,
        decoded.email ?? null,
        getStringClaim(decoded, "name"),
        getStringClaim(decoded, "picture")
      );
      upsertCache.set(decoded.uid, true);
    }

    const tier = await getUserTier(decoded.uid);
    req.user = {
      uid: decoded.uid,
      email: decoded.email ?? null,
      tier,
      displayName: getStringClaim(decoded, "name"),
      photoURL: getStringClaim(decoded, "picture")
    };

    req.log?.info({ uid: decoded.uid, tier }, "auth_optional_ok");
    next();
  } catch (err) {
    // Silent failure for optional auth
    req.log?.warn({ err }, "auth_optional_failed");
    next();
  }
};

