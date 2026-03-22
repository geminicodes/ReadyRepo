import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";
import { randomBytes, randomUUID } from "crypto";
import { getEnv } from "./config/env";
import { createLogger } from "./config/logger";
import { errorHandler } from "./middleware/errorHandler";
import { requestTimeout } from "./middleware/requestTimeout";
import { apiRouter } from "./routes";

function safeRandomId(): string {
  try {
    return randomUUID();
  } catch {
    return randomBytes(16).toString("hex");
  }
}

function isAllowedDevOrigin(origin: string): boolean {
  // Allow local dev and GitHub Codespaces port-forwarded URLs.
  try {
    const u = new URL(origin);
    if (u.protocol !== "http:" && u.protocol !== "https:") return false;
    const host = u.hostname.toLowerCase();

    if (host === "localhost" || host === "127.0.0.1") return true;
    if (host.endsWith(".app.github.dev")) return true;
    return false;
  } catch {
    return false;
  }
}

/**
 * Create the Express application with production-ready middleware order.
 */
export function createApp() {
  const env = getEnv();
  const logger = createLogger();
  const app = express();

  app.set("trust proxy", 1);
  app.set("logger", logger);
  app.disable("x-powered-by");

  app.use(
    pinoHttp({
      logger,
      // Ensure each request has a stable correlation ID and echo it back.
      genReqId: (req, res) => {
        const incoming = req.headers["x-request-id"];
        const id =
          typeof incoming === "string" && incoming.trim() && incoming.length <= 128
            ? incoming.trim()
            : safeRandomId();
        res.setHeader("x-request-id", id);
        return id;
      }
    })
  );
  app.use(requestTimeout());
  app.use(helmet());
  app.use(compression());

  /**
   * CORS
   *
   * - In Codespaces/dev, the frontend origin is often a forwarded URL
   *   like `https://<name>-5173.app.github.dev`, not `http://localhost:5173`.
   * - In production, restrict to the configured `CLIENT_ORIGIN` / `FRONTEND_URL`.
   */
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow non-browser clients (no Origin header).
        if (!origin) return callback(null, true);

        const allowedProd = [env.CLIENT_ORIGIN, env.FRONTEND_URL].filter(Boolean) as string[];
        if (env.NODE_ENV === "production") {
          const ok = allowedProd.includes(origin);
          return callback(ok ? null : new Error("CORS origin denied"), ok);
        }

        // Dev/test: allow configured origins plus safe local/codespaces patterns.
        if (allowedProd.includes(origin) || isAllowedDevOrigin(origin)) return callback(null, true);
        return callback(new Error("CORS origin denied"), false);
      },
      // This API uses Bearer tokens, not cookies; keep credentials disabled to reduce CSRF risk.
      credentials: false
    })
  );

  app.use(express.json({ limit: "1mb" }));

  app.use(
    rateLimit({
      windowMs: 60_000,
      limit: 120,
      standardHeaders: "draft-7",
      legacyHeaders: false
    })
  );

  // Friendly root page for Codespaces port forwarding (API is mounted at /api).
  app.get("/", (_req, res) => {
    res
      .status(200)
      .type("html")
      .send(
        [
          "<!doctype html>",
          "<html>",
          "<head><meta charset='utf-8'><title>ReadyRepo API</title></head>",
          "<body style='font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; padding: 24px'>",
          "<h1>ReadyRepo API is running</h1>",
          "<p>This port serves the backend API. Try:</p>",
          "<ul>",
          "<li><a href='/api/health'>/api/health</a></li>",
          "<li><a href='/api/v1'>/api/v1</a></li>",
          "</ul>",
          "<p>For the web UI in Codespaces, open the forwarded port for the Vite dev server (usually <b>5173</b>).</p>",
          "</body>",
          "</html>"
        ].join("")
      );
  });

  app.use("/api", apiRouter());

  app.use(errorHandler);
  return app;
}
