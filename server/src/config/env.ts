import "dotenv/config";
import { z } from "zod";

const boolFromString = z
  .string()
  .transform((v) => v.trim().toLowerCase())
  .pipe(z.enum(["true", "false"]))
  .transform((v) => v === "true");

const numberFromString = z
  .string()
  .transform((v) => Number(v))
  .refine((n) => Number.isFinite(n), "Must be a valid number");

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: numberFromString.default("8080"),
  CLIENT_ORIGIN: z.string().url().default("http://localhost:5173"),
  // Optional alternate origin used by some deployments
  FRONTEND_URL: z.string().url().optional(),
  REQUEST_TIMEOUT_MS: numberFromString.default("30000"),
  GITHUB_API_BASE_URL: z.string().url().default("https://api.github.com"),
  GITHUB_TOKEN: z.string().optional(),
  GITHUB_CACHE_TTL_MS: numberFromString.default("300000"),
  // Common Google/Firebase env var aliases used across deployments
  GOOGLE_CLOUD_PROJECT_ID: z.string().min(1).optional(),
  GCP_PROJECT_ID: z.string().min(1).optional(),
  FIREBASE_PROJECT_ID: z.string().min(1).optional(),
  GOOGLE_APPLICATION_CREDENTIALS: z.string().min(1).optional(),
  GOOGLE_CLOUD_CREDENTIALS_JSON: z.string().min(1).optional(),
  GCP_SERVICE_ACCOUNT_JSON: z.string().min(1).optional(),
  FIREBASE_SERVICE_ACCOUNT_JSON: z.string().min(1).optional(),
  GEMINI_API_KEY: z.string().min(1).optional(),
  GEMINI_MODEL: z.string().min(1).default("gemini-1.5-flash"),
  GEMINI_TIMEOUT_MS: numberFromString.default("30000"),
  STARTUP_CHECKS_ENABLED: boolFromString.default("true"),
  TONE_CACHE_TTL_HOURS: numberFromString.optional(),
  // Optional: server-side GA Measurement Protocol
  GA4_MEASUREMENT_ID: z.string().min(1).optional(),
  GA4_API_SECRET: z.string().min(1).optional()
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
