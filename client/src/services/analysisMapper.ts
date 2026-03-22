import type { AnalysisResult as SharedAnalysisResult, ToneAnalysis } from "@readyrepo/shared";
import type { AnalysisResult, Gap, Recommendation, Strength } from "@/types/analysis";

function isRecord(v: unknown): v is Record<string, unknown> {
  return Boolean(v) && typeof v === "object" && !Array.isArray(v);
}

export function toClientStrengths(items: unknown): Strength[] {
  if (!Array.isArray(items)) return [];
  return items.filter((x): x is string => typeof x === "string").map((point) => ({ point, evidence: "" }));
}

export function toClientGaps(items: unknown): Gap[] {
  if (!Array.isArray(items)) return [];
  return items.filter((x): x is string => typeof x === "string").map((gap) => ({ gap, impact: "medium", suggestion: "" }));
}

export function toClientRecommendations(items: unknown): Recommendation[] {
  if (!Array.isArray(items)) return [];
  return items.filter((x): x is string => typeof x === "string").map((action) => ({ action, priority: "medium", timeEstimate: "" }));
}

export function mapAnalyzeResponseToClient(params: {
  id: string;
  githubUsername: string;
  jobUrl: string;
  jobTitle: string;
  analysis: SharedAnalysisResult;
  tone: ToneAnalysis;
}): AnalysisResult {
  const { id, githubUsername, jobUrl, jobTitle, analysis, tone } = params;
  const analyzedAt = tone?.analysisMetadata?.analyzedAt ?? new Date().toISOString();

  return {
    id,
    githubUsername,
    githubAvatar: githubUsername ? `https://github.com/${githubUsername}.png` : "",
    jobTitle,
    jobCompany: "",
    jobUrl,
    analyzedAt,
    overallScore: analysis.overallScore,
    breakdown: {
      technicalSkills: analysis.scoreBreakdown.technicalSkillsMatch,
      experienceAlignment: analysis.scoreBreakdown.experienceAlignment,
      projectRelevance: analysis.scoreBreakdown.projectRelevance,
    },
    strengths: toClientStrengths(analysis.strengths ?? []),
    gaps: toClientGaps(analysis.gaps ?? []),
    recommendations: toClientRecommendations(analysis.recommendations ?? []),
    repositories: (analysis.repoScores ?? [])
      .filter((r) => Boolean(r.repoFullName))
      .map((r) => ({
        name: r.repoFullName ?? "unknown",
        url: r.repoFullName ? `https://github.com/${r.repoFullName}` : "",
        description: "",
        relevanceScore: Number(r.score ?? 0),
        languages: [],
        stars: 0,
        forks: 0,
        lastUpdated: "",
        whyItMatters: (r.notes ?? []).join(" "),
        highlights: r.notes ?? [],
        improvements: [],
        readmeGenerated: false,
      })),
  };
}

/**
 * Map the persisted Firestore analysis document into the UI's `AnalysisResult`.
 * Backend returns a flattened doc shape (overallScore, scoreBreakdown, strengths...).
 */
export function mapStoredAnalysisDocToClient(item: unknown): AnalysisResult | null {
  if (!isRecord(item)) return null;

  const id = typeof item["id"] === "string" ? item["id"] : "";
  const githubUsername = typeof item["githubUsername"] === "string" ? item["githubUsername"] : "";
  const jobUrl = typeof item["jobUrl"] === "string" ? item["jobUrl"] : "";
  const jobTitle = typeof item["jobTitle"] === "string" ? item["jobTitle"] : "";
  const createdAt = typeof item["createdAt"] === "string" ? item["createdAt"] : new Date().toISOString();

  const overallScore = typeof item["overallScore"] === "number" ? item["overallScore"] : 0;
  const scoreBreakdown = isRecord(item["scoreBreakdown"]) ? (item["scoreBreakdown"] as Record<string, unknown>) : {};

  const tech = typeof scoreBreakdown["technicalSkillsMatch"] === "number" ? scoreBreakdown["technicalSkillsMatch"] : 0;
  const exp = typeof scoreBreakdown["experienceAlignment"] === "number" ? scoreBreakdown["experienceAlignment"] : 0;
  const rel = typeof scoreBreakdown["projectRelevance"] === "number" ? scoreBreakdown["projectRelevance"] : 0;

  const repoScores = Array.isArray(item["repoScores"]) ? (item["repoScores"] as unknown[]) : [];
  const repositories = repoScores
    .map((r) => (isRecord(r) ? r : null))
    .filter(Boolean)
    .map((r) => {
      const fullName = typeof r["repoFullName"] === "string" ? r["repoFullName"] : "";
      const score = typeof r["score"] === "number" ? r["score"] : 0;
      const notes = Array.isArray(r["notes"]) ? r["notes"].filter((x): x is string => typeof x === "string") : [];
      return {
        name: fullName || "unknown",
        url: fullName ? `https://github.com/${fullName}` : "",
        description: "",
        relevanceScore: Number(score ?? 0),
        languages: [],
        stars: 0,
        forks: 0,
        lastUpdated: "",
        whyItMatters: notes.join(" "),
        highlights: notes,
        improvements: [],
        readmeGenerated: false,
      };
    });

  if (!id || !githubUsername) return null;

  return {
    id,
    githubUsername,
    githubAvatar: githubUsername ? `https://github.com/${githubUsername}.png` : "",
    jobTitle,
    jobCompany: "",
    jobUrl,
    analyzedAt: createdAt,
    overallScore,
    breakdown: {
      technicalSkills: tech,
      experienceAlignment: exp,
      projectRelevance: rel,
    },
    strengths: toClientStrengths(item["strengths"]),
    gaps: toClientGaps(item["gaps"]),
    recommendations: toClientRecommendations(item["recommendations"]),
    repositories,
  };
}

