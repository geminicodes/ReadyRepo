import { Router } from "express";
import { z } from "zod";
import { authenticateUser } from "../../middleware/auth";
import { HttpError } from "../../errors/httpError";

const schema = z.object({
  message: z.string().min(1).max(2000),
  context: z.record(z.any()).optional()
});

/**
 * Feedback endpoints.
 *
 * Mounted at `/api/v1/feedback`.
 */
export function feedbackRouter() {
  const router = Router();

  router.post("/", authenticateUser, async (req, res, next) => {
    try {
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return next(
          new HttpError({
            statusCode: 400,
            publicMessage: "Invalid request.",
            internalMessage: "Feedback request validation failed",
            details: { issues: parsed.error.issues }
          })
        );
      }

      // This build doesn't persist feedback yet; accept it so the client can proceed.
      res.json({ success: true, data: { received: true } });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

