import { getEnv } from "../config/env";

/**
 * Validate environment variables and exit non-zero on failure.
 */
function main() {
  try {
    getEnv();
    console.log("Environment variables look valid.");
    process.exit(0);
  } catch (err) {
    console.error("Environment validation failed:", err);
    process.exit(1);
  }
}

main();
