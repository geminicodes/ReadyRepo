import type pino from "pino";

/**
 * Optional startup checks that can be enabled via env.
 *
 * The server entrypoint (`src/index.ts`) imports this module. Some branches
 * accidentally omitted it, causing a hard crash on boot.
 *
 * Keep this conservative: do not fail startup unless we detect a clear misconfig.
 */
export async function runStartupChecks(logger?: pino.Logger) {
  // Placeholder for future checks (Firebase connectivity, required envs, etc.).
  // Intentionally no-op so dev can start reliably.
  logger?.info({ checks: [] }, "startup_checks_skipped");
}

