import { Router } from "express";
import { v1Router } from "./v1";
import { healthRouter } from "./health";

/**
 * Top-level API router mounted at `/api`.
 */
export function apiRouter() {
  const router = Router();
  router.use("/health", healthRouter());
  router.use("/v1", v1Router());
  return router;
}
