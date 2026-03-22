import { createApp } from "./app";
import { getEnv } from "./config/env";
import { runStartupChecks } from "./startupChecks";
import type pino from "pino";
import express from "express";

function safePort() {
  const raw = process.env.PORT;
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) && n > 0 ? n : 8080;
}

/**
 * Cloud Run requires the container to start listening quickly on $PORT.
 * If boot fails due to configuration, still start a minimal server so the
 * revision becomes ready and we can surface the error via /api/health.
 */
function startFallbackServer(err: unknown) {
  const port = safePort();
  const app = express();

  app.get("/api/health", (_req, res) => {
    res.status(503).json({
      success: false,
      error: "Service failed to start.",
      details: err instanceof Error ? err.message : String(err)
    });
  });

  app.get("/", (_req, res) => {
    res
      .status(200)
      .type("text/plain")
      .send("ReadyRepo API failed to boot. Check /api/health for details.");
  });

  app.listen(port, "0.0.0.0", () => {
    // eslint-disable-next-line no-console
    console.error("Started fallback server after fatal boot error.", { port });
  });
}

async function main() {
  const env = getEnv();
  const app = createApp();
  const logger = app.get("logger") as pino.Logger | undefined;

  if (env.STARTUP_CHECKS_ENABLED) {
    await runStartupChecks(logger);
  }

  app.listen(env.PORT, "0.0.0.0", () => {
    logger?.info?.({ port: env.PORT, nodeEnv: env.NODE_ENV }, "server_listening");
  });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Fatal startup error:", err);
  startFallbackServer(err);
});
