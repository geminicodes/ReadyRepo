import { Router } from "express";
import { getServiceHealthSnapshot } from "../services/healthService";

/**
 * Health endpoints.
 */
export function healthRouter() {
  const router = Router();

  router.get("/", async (req, res) => {
    try {
      const health = await getServiceHealthSnapshot();
      const statusCode = health.ok ? 200 : 503;
      res.status(statusCode).json({ success: true, data: health });
    } catch (err) {
      req.log?.error({ err }, "health_check_failed");
      res.status(503).json({ success: false, error: "Service unhealthy." });
    }
  });

  return router;
}
