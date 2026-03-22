import { Router } from "express";
import { optionalAuth } from "../../middleware/auth";
import { getRepoSnapshot } from "../../services/githubService";

/**
 * GitHub repository metadata endpoint.
 *
 * Mounted at `/api/v1/repos`.
 *
 * Note: This endpoint is intentionally usable without auth (optional auth),
 * since it only returns public GitHub data and is protected by global rate limiting.
 */
export function reposRouter() {
  const router = Router();

  router.get("/:owner/:repo", optionalAuth, async (req, res, next) => {
    try {
      const owner = String(req.params.owner ?? "");
      const repo = String(req.params.repo ?? "");

      const snapshot = await getRepoSnapshot({ owner, repo });
      res.json({ success: true, data: { repo: snapshot } });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

