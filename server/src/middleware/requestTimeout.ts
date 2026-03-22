import type { RequestHandler } from "express";
import { getEnv } from "../config/env";

/**
 * Enforce a hard timeout for inbound requests.
 */
export function requestTimeout(): RequestHandler {
  const { REQUEST_TIMEOUT_MS } = getEnv();

  return (req, res, next) => {
    req.setTimeout(REQUEST_TIMEOUT_MS);
    res.setTimeout(REQUEST_TIMEOUT_MS);
    next();
  };
}
