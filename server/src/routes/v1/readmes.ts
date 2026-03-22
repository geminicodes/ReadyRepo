import { Router } from "express";
import { authenticateUser } from "../../middleware/auth";
import { getUserREADMEsPage } from "../../services/firestoreService";

/**
 * Saved READMEs endpoint mounted at `/api/v1/readmes`.
 *
 * This is an alias of `/api/v1/history/readmes`, kept to satisfy frontend/backends
 * that expect a top-level `/readmes` collection endpoint.
 */
export function readmesRouter() {
  const router = Router();

  router.get("/", authenticateUser, async (req, res, next) => {
    try {
      const user = req.user!;
      const { items, nextCursor } = await getUserREADMEsPage({
        userId: user.uid,
        limit: req.query.limit,
        cursor: req.query.cursor
      });
      res.json({ success: true, data: { readmes: items, nextCursor } });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

