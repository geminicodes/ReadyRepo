"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEnv = getEnv;
require("dotenv/config");
const zod_1 = require("zod");
const boolFromString = zod_1.z
    .string()
    .transform((v) => v.trim().toLowerCase())
    .pipe(zod_1.z.enum(["true", "false"]))
    .transform((v) => v === "true");
const numberFromString = zod_1.z
    .string()
    .transform((v) => Number(v))
    .refine((n) => Number.isFinite(n), "Must be a valid number");
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(["development", "test", "production"]).default("development"),
    PORT: numberFromString.default("8080"),
    CLIENT_ORIGIN: zod_1.z.string().url().default("http://localhost:5173"),
    // Optional alternate origin used by some deployments
    FRONTEND_URL: zod_1.z.string().url().optional(),
    REQUEST_TIMEOUT_MS: numberFromString.default("30000"),
    GITHUB_API_BASE_URL: zod_1.z.string().url().default("https://api.github.com"),
    GITHUB_TOKEN: zod_1.z.string().optional(),
    GITHUB_CACHE_TTL_MS: numberFromString.default("300000"),
    // Common Google/Firebase env var aliases used across deployments
    GOOGLE_CLOUD_PROJECT_ID: zod_1.z.string().min(1).optional(),
    GCP_PROJECT_ID: zod_1.z.string().min(1).optional(),
    FIREBASE_PROJECT_ID: zod_1.z.string().min(1).optional(),
    GOOGLE_APPLICATION_CREDENTIALS: zod_1.z.string().min(1).optional(),
    GOOGLE_CLOUD_CREDENTIALS_JSON: zod_1.z.string().min(1).optional(),
    GCP_SERVICE_ACCOUNT_JSON: zod_1.z.string().min(1).optional(),
    FIREBASE_SERVICE_ACCOUNT_JSON: zod_1.z.string().min(1).optional(),
    GEMINI_API_KEY: zod_1.z.string().min(1).optional(),
    GEMINI_MODEL: zod_1.z.string().min(1).default("gemini-1.5-flash"),
    GEMINI_TIMEOUT_MS: numberFromString.default("30000"),
    STARTUP_CHECKS_ENABLED: boolFromString.default("true"),
    TONE_CACHE_TTL_HOURS: numberFromString.optional(),
    // Optional: server-side GA Measurement Protocol
    GA4_MEASUREMENT_ID: zod_1.z.string().min(1).optional(),
    GA4_API_SECRET: zod_1.z.string().min(1).optional()
});
/**
 * Load and validate environment variables (throws on invalid values).
 */
function getEnv() {
    const parsed = envSchema.safeParse(process.env);
    if (parsed.success)
        return parsed.data;
    const message = parsed.error.issues
        .map((i) => `${i.path.join(".") || "env"}: ${i.message}`)
        .join("; ");
    throw new Error(`Invalid environment configuration: ${message}`);
}
//# sourceMappingURL=env.js.map