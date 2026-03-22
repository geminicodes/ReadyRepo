"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.admin = void 0;
exports.initializeFirebase = initializeFirebase;
exports.getAuth = getAuth;
exports.getFirestore = getFirestore;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
exports.admin = firebase_admin_1.default;
const env_1 = require("./env");
let initialized = false;
function isRecord(v) {
    return Boolean(v) && typeof v === "object" && !Array.isArray(v);
}
function initializeFirebase() {
    if (initialized)
        return;
    const env = (0, env_1.getEnv)();
    const raw = env.FIREBASE_SERVICE_ACCOUNT_JSON ?? env.GCP_SERVICE_ACCOUNT_JSON ?? undefined;
    if (!raw) {
        // Fall back to Application Default Credentials if configured.
        firebase_admin_1.default.initializeApp({
            credential: firebase_admin_1.default.credential.applicationDefault(),
            projectId: env.FIREBASE_PROJECT_ID ?? env.GOOGLE_CLOUD_PROJECT_ID ?? env.GCP_PROJECT_ID
        });
        initialized = true;
        return;
    }
    let parsed;
    try {
        parsed = JSON.parse(raw);
    }
    catch {
        throw new Error("Invalid FIREBASE_SERVICE_ACCOUNT_JSON: must be valid JSON.");
    }
    if (!isRecord(parsed)) {
        throw new Error("Invalid FIREBASE_SERVICE_ACCOUNT_JSON: must be a JSON object.");
    }
    firebase_admin_1.default.initializeApp({
        credential: firebase_admin_1.default.credential.cert(parsed),
        projectId: env.FIREBASE_PROJECT_ID ??
            (typeof parsed["project_id"] === "string" ? parsed["project_id"] : undefined) ??
            env.GOOGLE_CLOUD_PROJECT_ID ??
            env.GCP_PROJECT_ID
    });
    initialized = true;
}
function getAuth() {
    initializeFirebase();
    return firebase_admin_1.default.auth();
}
function getFirestore() {
    initializeFirebase();
    return firebase_admin_1.default.firestore();
}
//# sourceMappingURL=firebase.js.map