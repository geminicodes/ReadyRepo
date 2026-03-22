import { Router } from "express";
import { authenticateUser } from "../../middleware/auth";
import { HttpError } from "../../errors/httpError";
import { getAnalysisById, getAnalysisHistoryPage, getUserREADMEsPage } from "../../services/firestoreService";

/**
 * History endpoints (Pro tier only storage; reads require auth).
 *
 * Mounted at `/api/v1/history`.
 */
export function historyRouter() {
  const router = Router();

  router.get("/", authenticateUser, async (req, res, next) => {
    try {
      const user = req.user!;
      const { items, nextCursor } = await getAnalysisHistoryPage({
        userId: user.uid,
        limit: req.query.limit,
        cursor: req.query.cursor
      });
      res.json({ success: true, data: { analyses: items, nextCursor } });
    } catch (err) {
      next(err);
    }
  });

  router.get("/analysis/:id", authenticateUser, async (req, res, next) => {
    try {
      const user = req.user!;
      const id = String(req.params.id);
      const item = await getAnalysisById(id, user.uid);
      if (!item) {
        return next(
          new HttpError({
            statusCode: 404,
            publicMessage: "Analysis not found.",
            internalMessage: "Analysis not found or not owned by user"
          })
        );
      }
      res.json({ success: true, data: { analysis: item } });
    } catch (err) {
      next(err);
    }
  });

  router.get("/readmes", authenticateUser, async (req, res, next) => {
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

