import { createApp } from "./app";
import { getEnv } from "./config/env";
import { runStartupChecks } from "./startupChecks";
import type pino from "pino";

async function main() {
  const env = getEnv();
  const app = createApp();
  const logger = app.get("logger") as pino.Logger | undefined;

  if (env.STARTUP_CHECKS_ENABLED) {
    await runStartupChecks(logger);
  }

  app.listen(env.PORT, () => {
    logger?.info?.({ port: env.PORT, nodeEnv: env.NODE_ENV }, "server_listening");
  });
}

main().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});
