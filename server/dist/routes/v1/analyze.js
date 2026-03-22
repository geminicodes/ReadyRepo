"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeRouter = analyzeRouter;
const express_1 = require("express");
const zod_1 = require("zod");
const httpError_1 = require("../../errors/httpError");
const toneAnalyzer_1 = require("../../services/toneAnalyzer");
const auth_1 = require("../../middleware/auth");
const userService_1 = require("../../services/userService");
const firestoreService_1 = require("../../services/firestoreService");
function isHttpUrl(input) {
    try {
        const u = new URL(input);
        return u.protocol === "http:" || u.protocol === "https:";
    }
    catch {
        return false;
    }
}
const schema = zod_1.z.object({
    githubUsername: zod_1.z.string().min(1).max(100),
    jobUrl: zod_1.z.string().url().refine(isHttpUrl, { message: "jobUrl must be http(s)." }),
    jobTitle: zod_1.z.string().min(1).max(200),
    // Prevent prompt/compute abuse.
    description: zod_1.z.string().min(1).max(50_000),
    isPublic: zod_1.z.boolean().optional()
});
/**
 * Analyzer endpoints.
 *
 * Currently implemented:
 * - POST `/api/v1/analyze` -> returns NL-powered tone analysis for a job description.
 */
function analyzeRouter() {
    const router = (0, express_1.Router)();
    router.post("/", auth_1.authenticateUser, async (req, res, next) => {
        try {
            const parsed = schema.safeParse(req.body);
            if (!parsed.success) {
                return next(new httpError_1.HttpError({
                    statusCode: 400,
                    publicMessage: "Invalid request.",
                    internalMessage: "Analyze request validation failed",
                    details: { issues: parsed.error.issues }
                }));
            }
            const user = req.user;
            const rate = await (0, userService_1.consumeAnalysisQuota)(user.uid);
            if (!rate.allowed) {
                return next(new httpError_1.HttpError({
                    statusCode: 429,
                    publicMessage: "Monthly limit reached for your tier.",
                    internalMessage: "User rate limit exceeded",
                    details: rate
                }));
            }
            // Use tier from the quota transaction to avoid brief cache inconsistencies.
            const effectiveTier = rate.tier;
            const tone = await (0, toneAnalyzer_1.analyzeJobTone)(parsed.data.description, parsed.data.jobUrl, req.log);
            // NOTE: In this trimmed build, the "analysis engine" isn't implemented yet.
            // Persist the expected shape with conservative defaults so history works.
            const analysisResult = {
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
            let analysisId = null;
            // Tier behavior: Free = 3/month, no history. Pro = unlimited + history.
            if (effectiveTier === "pro") {
                const saved = await (0, firestoreService_1.saveAnalysis)({
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
        }
        catch (err) {
            // Tone analyzer already falls back internally; reaching here is unexpected.
            next(err);
        }
    });
    return router;
}
//# sourceMappingURL=analyze.js.map