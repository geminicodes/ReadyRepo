import type { ErrorRequestHandler } from "express";
import { HttpError } from "../errors/httpError";

/**
 * Centralized error handler: logs server-side, returns safe client message.
 */
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const log = req.log ?? console;
  const requestId = (req.headers["x-request-id"] as string | undefined) ?? undefined;

  const isHttpError = err instanceof HttpError;
  const statusCode = isHttpError ? err.statusCode : 500;
  const publicMessage = isHttpError ? err.publicMessage : "Unexpected server error.";
  const details = isHttpError ? err.details : undefined;

  log.error(
    {
      err,
      statusCode,
      requestId,
      path: req.path,
      method: req.method
    },
    "request_failed"
  );

  // Only echo safe, non-sensitive metadata for rate-limit errors.
  const safeDetails =
    statusCode === 429 && details && typeof details === "object"
      ? {
          remaining: (details as Record<string, unknown>)["remaining"] ?? undefined,
          resetsAt: (details as Record<string, unknown>)["resetsAt"] ?? undefined,
          tier: (details as Record<string, unknown>)["tier"] ?? undefined
        }
      : undefined;

  res.status(statusCode).json({
    success: false,
    error: publicMessage,
    ...(safeDetails ? { details: safeDetails } : {})
  });
};
