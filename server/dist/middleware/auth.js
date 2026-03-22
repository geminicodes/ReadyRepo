"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.authenticateUser = void 0;
const lru_cache_1 = require("lru-cache");
const httpError_1 = require("../errors/httpError");
const firebase_1 = require("../config/firebase");
const userService_1 = require("../services/userService");
function parseBearerToken(header) {
    if (!header)
        return null;
    const match = /^\s*bearer\s+(.+)\s*$/i.exec(header);
    if (!match)
        return null;
    const token = match[1]?.trim();
    if (!token)
        return null;
    // Guard against absurdly large headers (basic DoS hardening).
    if (token.length > 10_000)
        return null;
    return token;
}
function getStringClaim(token, key) {
    const value = token[key];
    return typeof value === "string" ? value : null;
}
const tierCache = new lru_cache_1.LRUCache({
    max: 10_000,
    ttl: 60_000
});
const upsertCache = new lru_cache_1.LRUCache({
    max: 10_000,
    ttl: 5 * 60_000
});
async function getUserTier(uid) {
    const cached = tierCache.get(uid);
    if (cached)
        return cached;
    const db = (0, firebase_1.getFirestore)();
    const snap = await db.collection("users").doc(uid).get();
    const tier = (snap.exists ? snap.data()?.tier : undefined) ?? "free";
    const normalized = tier === "pro" ? "pro" : "free";
    tierCache.set(uid, normalized);
    return normalized;
}
const authenticateUser = async (req, _res, next) => {
    try {
        const token = parseBearerToken(req.header("authorization"));
        if (!token) {
            return next(new httpError_1.HttpError({
                statusCode: 401,
                publicMessage: "Authentication required.",
                internalMessage: "Missing bearer token"
            }));
        }
        const auth = (0, firebase_1.getAuth)();
        const decoded = await auth.verifyIdToken(token, true);
        // Ensure user exists/updated in Firestore (server-trusted fields).
        // Cache this lightly to avoid write amplification on high-traffic APIs.
        if (!upsertCache.get(decoded.uid)) {
            await (0, userService_1.createOrUpdateUser)(decoded.uid, decoded.email ?? null, getStringClaim(decoded, "name"), getStringClaim(decoded, "picture"));
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
    }
    catch (err) {
        req.log?.warn({ err }, "auth_failed");
        next(new httpError_1.HttpError({
            statusCode: 401,
            publicMessage: "Invalid or expired token.",
            internalMessage: "Token verification failed"
        }));
    }
};
exports.authenticateUser = authenticateUser;
const optionalAuth = async (req, _res, next) => {
    const token = parseBearerToken(req.header("authorization"));
    if (!token)
        return next();
    try {
        const auth = (0, firebase_1.getAuth)();
        const decoded = await auth.verifyIdToken(token, true);
        if (!upsertCache.get(decoded.uid)) {
            await (0, userService_1.createOrUpdateUser)(decoded.uid, decoded.email ?? null, getStringClaim(decoded, "name"), getStringClaim(decoded, "picture"));
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
    }
    catch (err) {
        // Silent failure for optional auth
        req.log?.warn({ err }, "auth_optional_failed");
        next();
    }
};
exports.optionalAuth = optionalAuth;
//# sourceMappingURL=auth.js.map