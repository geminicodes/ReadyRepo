// History and README API service (authenticated)

import { HistoryAnalysis, SavedREADME } from '@/types/history';
import { authFetch } from '@/services/authFetch';

const API_URL = (import.meta.env.VITE_API_URL || '/api/v1').replace(/\/+$/, '');

function isRecord(v: unknown): v is Record<string, unknown> {
  return Boolean(v) && typeof v === 'object' && !Array.isArray(v);
}

function asString(v: unknown, fallback: string = ''): string {
  return typeof v === 'string' ? v : fallback;
}

function asNumber(v: unknown, fallback: number = 0): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}

function toIsoDate(v: unknown): string {
  if (typeof v === 'string') return v;
  if (isRecord(v)) {
    const seconds = v['_seconds'] ?? v['seconds'];
    if (typeof seconds === 'number' && Number.isFinite(seconds)) {
      return new Date(seconds * 1000).toISOString();
    }
  }
  return new Date().toISOString();
}

function toHistoryAnalysis(item: unknown): HistoryAnalysis | null {
  if (!isRecord(item)) return null;

  const githubUsername = asString(item['githubUsername'], '');
  const overallScore = asNumber(item['overallScore'], 0);

  const scoreBreakdown = isRecord(item['scoreBreakdown']) ? item['scoreBreakdown'] : null;
  const technicalScore = isRecord(scoreBreakdown) ? asNumber(scoreBreakdown['technicalSkillsMatch'], 0) : 0;
  const experienceScore = isRecord(scoreBreakdown) ? asNumber(scoreBreakdown['experienceAlignment'], 0) : 0;
  const relevanceScore = isRecord(scoreBreakdown) ? asNumber(scoreBreakdown['projectRelevance'], 0) : 0;

  const repoScores = item['repoScores'];
  const repoCount = Array.isArray(repoScores) ? repoScores.length : 0;

  return {
    id: asString(item['id'], ''),
    githubUsername,
    // Best-effort: the API doesn't currently provide avatars.
    githubAvatar: githubUsername ? `https://github.com/${githubUsername}.png` : '',
    jobTitle: asString(item['jobTitle'], ''),
    // API doesn't currently expose company in a stable field.
    jobCompany: asString(item['jobCompany'], ''),
    overallScore,
    technicalScore,
    experienceScore,
    relevanceScore,
    analyzedAt: toIsoDate(item['createdAt'] ?? item['analyzedAt']),
    repoCount,
  };
}

function parseOwnerFromRepoUrl(repoUrl: string): string {
  try {
    const u = new URL(repoUrl);
    const parts = u.pathname.split("/").filter(Boolean);
    return parts[0] ?? "";
  } catch {
    // best-effort for non-URL strings
    const parts = String(repoUrl ?? "").split("/").filter(Boolean);
    const idx = parts.findIndex((p) => p.toLowerCase() === "github.com");
    if (idx >= 0 && parts[idx + 1]) return parts[idx + 1]!;
    return parts[0] ?? "";
  }
}

function toSavedREADME(item: unknown): SavedREADME | null {
  if (!isRecord(item)) return null;

  const toneObj = isRecord(item['tone']) ? item['tone'] : null;
  const tone = (isRecord(toneObj) ? toneObj['tone'] : null) as SavedREADME['tone'] | null;

  const jobCtx = isRecord(item['jobContext']) ? item['jobContext'] : null;
  const jobTitle = isRecord(jobCtx) ? asString(jobCtx['jobTitle'], '') : '';
  const company = isRecord(jobCtx) ? asString(jobCtx['company'], '') : '';
  const jobContext = [jobTitle, company].filter(Boolean).join(' at ') || asString(item['jobContext'], '');

  const repoUrl = asString(item['repoUrl'], '');
  const githubUsername = asString(item['githubUsername'], '') || parseOwnerFromRepoUrl(repoUrl);

  return {
    id: asString(item['id'], ''),
    githubUsername,
    githubAvatar: githubUsername ? `https://github.com/${githubUsername}.png` : '',
    repoName: asString(item['repoName'], ''),
    repoUrl,
    tone: (tone ?? 'corporate') as SavedREADME['tone'],
    jobContext,
    markdown: asString(item['generatedREADME'] ?? item['markdown'], ''),
    generatedAt: toIsoDate(item['createdAt'] ?? item['generatedAt']),
    analysisId: asString(item['analysisId'], ''),
  };
}

type PageResult<T> = { items: T[]; nextCursor: string | null };

function asCursor(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v : null;
}

export async function fetchAnalysisHistoryPage(params: {
  limit?: number;
  cursor?: string | null;
}): Promise<PageResult<HistoryAnalysis>> {
  const limit = Math.max(1, Math.min(50, Math.floor(params.limit ?? 10)));
  const qs = new URLSearchParams();
  qs.set("limit", String(limit));
  if (params.cursor) qs.set("cursor", params.cursor);

  const response = await authFetch(`${API_URL}/history?${qs.toString()}`);
  if (!response.ok) throw new Error("history-fetch-failed");

  const json = (await response.json().catch(() => null)) as unknown;
  const maybeData = isRecord(json) ? (json['data'] as unknown) : null;
  const analysesRaw =
    isRecord(maybeData) && Array.isArray(maybeData['analyses'])
      ? (maybeData['analyses'] as unknown[])
      : [];

  const mapped = analysesRaw
    .map(toHistoryAnalysis)
    .filter((x): x is HistoryAnalysis => Boolean(x && x.id));

  const nextCursor = isRecord(maybeData) ? asCursor(maybeData["nextCursor"]) : null;
  return { items: mapped, nextCursor };
}

export async function fetchAnalysisHistory(limit: number = 10): Promise<HistoryAnalysis[]> {
  const page = await fetchAnalysisHistoryPage({ limit });
  return page.items.slice(0, limit);
}

export async function fetchAnalysisById(id: string): Promise<HistoryAnalysis | null> {
  const response = await authFetch(`${API_URL}/history/analysis/${encodeURIComponent(id)}`);
  if (!response.ok) return null;
  const json = await response.json().catch(() => null);
  const maybeData = isRecord(json) ? (json['data'] as unknown) : null;
  const analysisRaw = isRecord(maybeData) ? maybeData['analysis'] : null;
  return toHistoryAnalysis(analysisRaw);
}

export async function fetchUserREADMEsPage(params: {
  limit?: number;
  cursor?: string | null;
}): Promise<PageResult<SavedREADME>> {
  const limit = Math.max(1, Math.min(50, Math.floor(params.limit ?? 20)));
  const qs = new URLSearchParams();
  qs.set("limit", String(limit));
  if (params.cursor) qs.set("cursor", params.cursor);

  // Prefer top-level endpoint; backend also supports `/history/readmes`.
  const response = await authFetch(`${API_URL}/readmes?${qs.toString()}`);
  if (!response.ok) throw new Error("readmes-fetch-failed");

  const json = (await response.json().catch(() => null)) as unknown;
  const maybeData = isRecord(json) ? (json['data'] as unknown) : null;
  const readmesRaw =
    isRecord(maybeData) && Array.isArray(maybeData['readmes'])
      ? (maybeData['readmes'] as unknown[])
      : [];

  const mapped = readmesRaw
    .map(toSavedREADME)
    .filter((x): x is SavedREADME => Boolean(x && x.id));

  const nextCursor = isRecord(maybeData) ? asCursor(maybeData["nextCursor"]) : null;
  return { items: mapped, nextCursor };
}

export async function fetchUserREADMEs(limit: number = 20): Promise<SavedREADME[]> {
  const page = await fetchUserREADMEsPage({ limit });
  return page.items.slice(0, limit);
}

export async function fetchREADMEById(id: string): Promise<SavedREADME | null> {
  // Not currently supported by backend; readmes are loaded from list pages.
  void id;
  return null;
}

export async function deleteAnalysis(id: string): Promise<boolean> {
  // Not currently supported.
  void id;
  return true;
}

export async function deleteREADME(id: string): Promise<boolean> {
  // Not currently supported.
  void id;
  return true;
}

export async function exportHistoryCSV(): Promise<Blob> {
  const headers = ['Date', 'GitHub', 'Job Title', 'Company', 'Overall Score', 'Technical', 'Experience', 'Relevance'];
  const page = await fetchAnalysisHistoryPage({ limit: 50, cursor: null });
  const rows = page.items.map(a => [
    new Date(a.analyzedAt).toLocaleDateString(),
    a.githubUsername,
    a.jobTitle,
    a.jobCompany,
    a.overallScore,
    a.technicalScore,
    a.experienceScore,
    a.relevanceScore,
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  return new Blob([csv], { type: 'text/csv' });
}
