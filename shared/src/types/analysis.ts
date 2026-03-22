export type RepoScore = {
  repoFullName?: string;
  score?: number;
  notes?: string[];
};

export type AnalysisResult = {
  overallScore: number;
  scoreBreakdown: {
    technicalSkillsMatch: number;
    experienceAlignment: number;
    projectRelevance: number;
  };
  strengths: string[];
  gaps: string[];
  recommendations: string[];
  repoScores: RepoScore[];
};

