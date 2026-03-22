import { Router } from "express";
import { z } from "zod";
import { HttpError } from "../../errors/httpError";
import { analyzeJobTone } from "../../services/toneAnalyzer";
import { authenticateUser } from "../../middleware/auth";
import { consumeAnalysisQuota } from "../../services/userService";
import { saveAnalysis } from "../../services/firestoreService";
import type { AnalysisResult } from "@readyrepo/shared";

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

      // Use tier from the quota transaction to avoid brief cache inconsistencies.
      const effectiveTier = rate.tier;

      const tone = await analyzeJobTone(parsed.data.description, parsed.data.jobUrl, req.log);

      // NOTE: In this trimmed build, the "analysis engine" isn't implemented yet.
      // Persist the expected shape with conservative defaults so history works.
      const analysisResult: AnalysisResult = {
        overallScore: 0,
        scoreBreakdown: {
          technicalSkillsMatch: 0,
          experienceAlignment: 0,
          projectRelevance: 0
        },
        strengths: [],
        gaps: [],
        recommendations: [],
        repoScores: []
      };

      let analysisId: string | null = null;

      // Tier behavior: Free = 3/month, no history. Pro = unlimited + history.
      if (effectiveTier === "pro") {
        const saved = await saveAnalysis({
          userId: user.uid,
          githubUsername: parsed.data.githubUsername,
          jobUrl: parsed.data.jobUrl,
          jobTitle: parsed.data.jobTitle,
          analysisResult,
          toneAnalysis: tone,
          isPublic: Boolean(parsed.data.isPublic ?? false)
        });
        analysisId = saved.analysisId;
      }

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

