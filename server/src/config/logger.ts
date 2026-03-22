import pino from "pino";

/**
 * Create the application logger (JSON logs, production-friendly).
 */
export function createLogger() {
  const isProd = process.env.NODE_ENV === "production";
  return pino({
    level: process.env.LOG_LEVEL ?? "info",
    base: { service: "readyrepo-server" },
    redact: {
      paths: ["req.headers.authorization", "req.headers.cookie"],
      remove: true
    },
    transport: isProd
      ? undefined
      : {
          target: "pino-pretty",
          options: { colorize: true, translateTime: "SYS:standard" }
        }
  });
}
