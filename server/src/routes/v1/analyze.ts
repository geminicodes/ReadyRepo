import { Router } from "express";
import { z } from "zod";
import { HttpError } from "../../errors/httpError";
import { analyzeJobTone } from "../../services/toneAnalyzer";
import { authenticateUser } from "../../middleware/auth";
import { consumeAnalysisQuota } from "../../services/userService";
import { saveAnalysis } from "../../services/firestoreService";
import type { AnalysisResult } from "@readyrepo/shared";
import { analyzeGitHubPortfolioFit } from "../../services/analysisEngine";

function isHttpUrl(input: string): boolean {
  try {
    const u = new URL(input);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

const schema = z.object({
  githubUsername: z.string().min(1).max(100),
  jobUrl: z.string().url().refine(isHttpUrl, { message: "jobUrl must be http(s)." }),
  jobTitle: z.string().min(1).max(200),
  // Prevent prompt/compute abuse.
  description: z.string().min(1).max(50_000),
  isPublic: z.boolean().optional()
});

/**
 * Analyzer endpoints.
 *
 * Currently implemented:
 * - POST `/api/v1/analyze` -> returns NL-powered tone analysis for a job description.
 */
export function analyzeRouter() {
  const router = Router();

  router.post("/", authenticateUser, async (req, res, next) => {
    try {
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return next(
          new HttpError({
            statusCode: 400,
            publicMessage: "Invalid request.",
            internalMessage: "Analyze request validation failed",
            details: { issues: parsed.error.issues }
          })
        );
      }

      const user = req.user!;

      const rate = await consumeAnalysisQuota(user.uid);
      if (!rate.allowed) {
        return next(
          new HttpError({
            statusCode: 429,
            publicMessage: "Monthly limit reached for your tier.",
            internalMessage: "User rate limit exceeded",
            details: rate
          })
        );
      }

      const tone = await analyzeJobTone(parsed.data.description, parsed.data.jobUrl, req.log);

      const analysisResult: AnalysisResult = await analyzeGitHubPortfolioFit({
        githubUsername: parsed.data.githubUsername,
        jobUrl: parsed.data.jobUrl,
        jobTitle: parsed.data.jobTitle,
        jobDescription: parsed.data.description,
        toneAnalysis: tone,
        logger: req.log
      });

      // Persist analysis for the signed-in user (all tiers).
      const saved = await saveAnalysis({
        userId: user.uid,
        githubUsername: parsed.data.githubUsername,
        jobUrl: parsed.data.jobUrl,
        jobTitle: parsed.data.jobTitle,
        analysisResult,
        toneAnalysis: tone,
        isPublic: Boolean(parsed.data.isPublic ?? false)
      });
      const analysisId = saved.analysisId;

      res.json({
        success: true,
        data: {
          analysisId,
          rateLimit: rate,
          analysisResult,
          toneAnalysis: tone
        }
      });
    } catch (err) {
      // Tone analyzer already falls back internally; reaching here is unexpected.
      next(err);
    }
  });

  return router;
}

