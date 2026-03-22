import "dotenv/config";
import { z } from "zod";

function emptyToUndefined(v: unknown) {
  return typeof v === "string" && v.trim() === "" ? undefined : v;
}

const boolFromString = z
  .string()
  .transform((v) => v.trim().toLowerCase())
  .pipe(z.enum(["true", "false"]))
  .transform((v) => v === "true");

const numberFromString = z
  .string()
  .transform((v) => Number(v))
  .refine((n) => Number.isFinite(n), "Must be a valid number");

const optionalNonEmptyString = z.preprocess(emptyToUndefined, z.string().min(1).optional());
const optionalUrl = z.preprocess(emptyToUndefined, z.string().url().optional());
const optionalString = z.preprocess(emptyToUndefined, z.string().optional());

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: numberFromString.default("8080"),
  CLIENT_ORIGIN: z.string().url().default("http://localhost:5173"),
  // Optional alternate origin used by some deployments
  FRONTEND_URL: optionalUrl,
  REQUEST_TIMEOUT_MS: numberFromString.default("30000"),
  GITHUB_API_BASE_URL: z.string().url().default("https://api.github.com"),
  GITHUB_TOKEN: optionalString,
  GITHUB_CACHE_TTL_MS: numberFromString.default("300000"),
  // Common Google/Firebase env var aliases used across deployments
  GOOGLE_CLOUD_PROJECT_ID: optionalNonEmptyString,
  GCP_PROJECT_ID: optionalNonEmptyString,
  FIREBASE_PROJECT_ID: optionalNonEmptyString,
  GOOGLE_APPLICATION_CREDENTIALS: optionalNonEmptyString,
  GOOGLE_CLOUD_CREDENTIALS_JSON: optionalNonEmptyString,
  GCP_SERVICE_ACCOUNT_JSON: optionalNonEmptyString,
  FIREBASE_SERVICE_ACCOUNT_JSON: optionalNonEmptyString,
  GEMINI_API_KEY: optionalNonEmptyString,
  GEMINI_MODEL: z.string().min(1).default("gemini-1.5-flash"),
  // Comma-separated list of fallback models (e.g. "gemini-2.0-flash,gemini-2.0-flash-lite")
  GEMINI_FALLBACK_MODELS: optionalString,
  GEMINI_TIMEOUT_MS: numberFromString.default("30000"),
  GEMINI_MAX_RETRIES: numberFromString.default("2"),
  STARTUP_CHECKS_ENABLED: boolFromString.default("true"),
  TONE_CACHE_TTL_HOURS: numberFromString.optional(),
  // Optional: server-side GA Measurement Protocol
  GA4_MEASUREMENT_ID: optionalNonEmptyString,
  GA4_API_SECRET: optionalNonEmptyString
});

export type Env = z.infer<typeof envSchema>;

/**
 * Load and validate environment variables (throws on invalid values).
 */
export function getEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (parsed.success) return parsed.data;

  const message = parsed.error.issues
    .map((i) => `${i.path.join(".") || "env"}: ${i.message}`)
    .join("; ");
  throw new Error(`Invalid environment configuration: ${message}`);
}
