import { createContext, useContext, useState, ReactNode } from 'react';
import type { AnalysisResult as SharedAnalysisResult, ToneAnalysis } from "@readyrepo/shared";
import type { AnalysisResult } from '@/types/analysis';
import { authFetch } from "@/services/authFetch";
import { mapAnalyzeResponseToClient } from "@/services/analysisMapper";
import { emitUsageUpdate } from "@/hooks/use-rate-limit";
import { setAnalysisUsage } from "@/lib/rateLimit";
import { auth } from "@/config/firebase";

interface AnalysisContextType {
  isAnalyzing: boolean;
  setIsAnalyzing: (value: boolean) => void;
  analysisResult: AnalysisResult | null;
  setAnalysisResult: (result: AnalysisResult | null) => void;
  error: string | null;
  setError: (error: string | null) => void;
  lastJob: { jobUrl: string; jobTitle: string; description: string } | null;
  setLastJob: (job: { jobUrl: string; jobTitle: string; description: string } | null) => void;
  startAnalysis: (params: {
    username: string;
    jobUrl: string;
    jobTitle: string;
    description: string;
  }) => Promise<string>;
}

const AnalysisContext = createContext<AnalysisContextType | undefined>(undefined);

function isRecord(v: unknown): v is Record<string, unknown> {
  return Boolean(v) && typeof v === "object" && !Array.isArray(v);
}

// (mapping moved to `services/analysisMapper.ts` so Results can reuse it)

export function AnalysisProvider({ children }: { children: ReactNode }) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastJob, setLastJob] = useState<{ jobUrl: string; jobTitle: string; description: string } | null>(null);

  const startAnalysis: AnalysisContextType["startAnalysis"] = async (params) => {
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const username = params.username.trim();
      const normalizedJobUrl = params.jobUrl.trim();
      const normalizedJobTitle = params.jobTitle.trim();
      const normalizedDescription = params.description.trim();

      // Don't hard-fail client-side here. The form already validates these fields,
      // and relying on client state can cause false negatives in production.
      // If something is missing, the backend will return a 400 with validation errors.

      // Keep context state in sync for downstream flows (e.g., README generation).
      setLastJob({ jobUrl: normalizedJobUrl, jobTitle: normalizedJobTitle, description: normalizedDescription });

      const base = (import.meta.env.VITE_API_URL || "/api/v1").replace(/\/+$/, "");
      const res = await authFetch(`${base}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          githubUsername: username,
          jobUrl: normalizedJobUrl,
          jobTitle: normalizedJobTitle,
          description: normalizedDescription,
        }),
      });

      const json = (await res.json().catch(() => null)) as unknown;
      if (!res.ok) {
        // Never surface raw backend error text (could include sensitive details).
        if (res.status === 401) throw new Error("Your session expired. Please sign in again.");
        if (res.status === 429) throw new Error("Monthly limit reached. Upgrade to Pro for unlimited analyses.");
        throw new Error("Analysis failed. Please try again.");
      }

      const data = isRecord(json) ? (json["data"] as unknown) : null;
      const analysis = isRecord(data) ? (data["analysisResult"] as SharedAnalysisResult) : null;
      const tone = isRecord(data) ? (data["toneAnalysis"] as ToneAnalysis) : null;
      const analysisId = isRecord(data) ? (data["analysisId"] as unknown) : null;
      const rateLimit = isRecord(data) ? (data["rateLimit"] as unknown) : null;

      if (!analysis || !tone) throw new Error("invalid-response");

      const id =
        typeof analysisId === "string" && analysisId.trim()
          ? analysisId
          : `local-${Date.now()}`;

      // Sync local rate-limit UI with backend when possible (free-tier only).
      if (isRecord(rateLimit) && rateLimit["tier"] === "free") {
        const remaining = typeof rateLimit["remaining"] === "number" ? rateLimit["remaining"] : null;
        if (typeof remaining === "number" && Number.isFinite(remaining)) {
          const used = Math.max(0, Math.min(3, 3 - Math.floor(remaining)));
          setAnalysisUsage(auth.currentUser?.uid ?? null, used);
          emitUsageUpdate();
        }
      }

      const result = mapAnalyzeResponseToClient({
        id,
        githubUsername: username,
        jobUrl: normalizedJobUrl,
        jobTitle: normalizedJobTitle,
        analysis,
        tone,
      });

      setAnalysisResult(result);
      setIsAnalyzing(false);
      
      return result.id;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed. Please try again.');
      setIsAnalyzing(false);
      throw err;
    }
  };

  return (
    <AnalysisContext.Provider
      value={{
        isAnalyzing,
        setIsAnalyzing,
        analysisResult,
        setAnalysisResult,
        error,
        setError,
        lastJob,
        setLastJob,
        startAnalysis,
      }}
    >
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysis() {
  const context = useContext(AnalysisContext);
  if (context === undefined) {
    throw new Error('useAnalysis must be used within an AnalysisProvider');
  }
  return context;
}