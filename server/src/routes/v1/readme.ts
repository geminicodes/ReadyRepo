import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import type { GenerateReadmeRequest } from "@readyrepo/shared";
import { HttpError } from "../../errors/httpError";
import { generateEnhancedReadme } from "../../services/readmeGenerationService";
import { authenticateUser } from "../../middleware/auth";
import { saveGeneratedREADME } from "../../services/firestoreService";
import { analyzeJobTone } from "../../services/toneAnalyzer";

function isHttpUrl(input: string): boolean {
  try {
    const u = new URL(input);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

const repoSchema = z.object({
  name: z.string().min(1).max(200),
  fullName: z.string().min(1).max(200),
  htmlUrl: z.string().url(),
  description: z.string().nullable(),
  languages: z.array(z.string().min(1).max(50)).max(200),
  stars: z.number(),
  forks: z.number(),
  updatedAt: z.string(),
  defaultBranch: z.string().min(1).max(200),
  // Cap README input size to avoid prompt abuse / memory spikes.
  readme: z.string().max(200_000).nullable(),
  topics: z.array(z.string().min(1).max(50)).max(100)
});

const jobSchema = z.object({
  url: z.string().url().refine(isHttpUrl, { message: "job.url must be http(s)." }),
  title: z.string().min(1).max(200),
  company: z.string().nullable(),
  description: z.string().min(1).max(50_000),
  requirements: z.array(z.string().min(1).max(500)).max(500),
  skills: z.array(z.string().min(1).max(100)).max(500),
  experienceLevel: z.string().nullable(),
  rawText: z.string().max(200_000)
});

const generateReadmeSchema = z.object({
  repo: repoSchema,
  currentReadme: z.string().nullable().optional(),
  job: jobSchema,
  analysisId: z.string().nullable().optional()
});

/**
 * README generation endpoints mounted at:
 * - `/api/v1/generate-readme`
 * - (alias) `/api/generate-readme`
 */
export function readmeRouter() {
  const router = Router();

  // Stricter than global limiter to prevent abuse.
  router.use(
    rateLimit({
      windowMs: 60_000,
      limit: 10,
      standardHeaders: "draft-7",
      legacyHeaders: false
    })
  );

  router.post("/", authenticateUser, async (req, res, next) => {
    try {
      const parsed = generateReadmeSchema.safeParse(req.body);
      if (!parsed.success) {
        return next(
          new HttpError({
            statusCode: 400,
            publicMessage: "Invalid request.",
            internalMessage: "Generate README validation failed",
            details: { issues: parsed.error.issues }
          })
        );
      }

      const user = req.user!;

      const input = parsed.data as GenerateReadmeRequest;
      const result = await generateEnhancedReadme(input);

      let readmeId: string | null = null;
      if (user.tier === "pro") {
        const tone = await analyzeJobTone(input.job.description, input.job.url, req.log);
        const saved = await saveGeneratedREADME({
          userId: user.uid,
          analysisId: parsed.data.analysisId ?? null,
          repoName: input.repo.name,
          repoUrl: input.repo.htmlUrl,
          originalREADME: input.currentReadme ?? input.repo.readme ?? null,
          generatedREADME: result.generatedReadme,
          tone,
          jobContext: {
            jobUrl: input.job.url,
            jobTitle: input.job.title,
            company: input.job.company
          }
        });
        readmeId = saved.readmeId;
      }

      res.json({ success: true, data: { ...result, readmeId } });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

