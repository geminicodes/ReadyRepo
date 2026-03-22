import type { GitHubRepo } from "./github";
import type { JobPosting, ToneAnalysis } from "./job";

export type GenerateReadmeRequest = {
  repo: GitHubRepo;
  currentReadme?: string | null;
  job: JobPosting;
  analysisId?: string | null;
};

export type GenerateReadmeResponse = {
  generatedReadme: string;
  warnings: string[];
  toneAnalysis?: ToneAnalysis | null;
};

