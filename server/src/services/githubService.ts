import { LRUCache } from "lru-cache";
import { getEnv } from "../config/env";
import { HttpError } from "../errors/httpError";
import type { GitHubRepo } from "@readyrepo/shared";

type GitHubRepoApiResponse = {
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  default_branch: string;
  topics?: string[];
};

type GitHubReadmeApiResponse = {
  content?: string;
  encoding?: string;
};

type CacheEntry = { value: GitHubRepo; expiresAt: number };

const repoCache = new LRUCache<string, CacheEntry>({ max: 1000 });

function nowMs() {
  return Date.now();
}

function getCacheTtlMs() {
  const env = getEnv();
  return env.GITHUB_CACHE_TTL_MS ?? 300_000;
}

function withTimeout<T>(p: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`${label}_timeout`)), timeoutMs);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      }
    );
  });
}

async function fetchGitHubJson<T>(path: string): Promise<T> {
  const env = getEnv();
  const base = env.GITHUB_API_BASE_URL.replace(/\/+$/, "");
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;

  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "repomax-server"
  };
  if (env.GITHUB_TOKEN) headers.Authorization = `Bearer ${env.GITHUB_TOKEN}`;

  let res: Response;
  try {
    res = await withTimeout(fetch(url, { headers }), 12_000, "github_fetch");
  } catch (err) {
    throw new HttpError({
      statusCode: 502,
      publicMessage: "GitHub request failed.",
      internalMessage: "GitHub fetch failed",
      details: { url, err: String((err as Error)?.message ?? err) }
    });
  }

  if (res.status === 404) {
    throw new HttpError({
      statusCode: 404,
      publicMessage: "Repository not found.",
      internalMessage: "GitHub repo not found",
      details: { url }
    });
  }

  if (res.status === 401 || res.status === 403) {
    // Includes rate limiting; keep message generic.
    throw new HttpError({
      statusCode: 502,
      publicMessage: "GitHub request was rejected.",
      internalMessage: "GitHub authorization/rate-limit failure",
      details: { url, status: res.status }
    });
  }

  if (!res.ok) {
    throw new HttpError({
      statusCode: 502,
      publicMessage: "GitHub request failed.",
      internalMessage: "GitHub non-OK response",
      details: { url, status: res.status }
    });
  }

  return (await res.json()) as T;
}

function safeBase64Decode(input: string): string {
  try {
    // GitHub returns base64 with line breaks; strip whitespace.
    const normalized = input.replace(/\s+/g, "");
    return Buffer.from(normalized, "base64").toString("utf8");
  } catch {
    return "";
  }
}

async function fetchRepo(owner: string, repo: string): Promise<GitHubRepoApiResponse> {
  return fetchGitHubJson<GitHubRepoApiResponse>(`/repos/${owner}/${repo}`);
}

async function fetchLanguages(owner: string, repo: string): Promise<string[]> {
  const raw = await fetchGitHubJson<Record<string, number>>(`/repos/${owner}/${repo}/languages`);
  return Object.keys(raw ?? {});
}

async function fetchReadme(owner: string, repo: string): Promise<string | null> {
  try {
    const raw = await fetchGitHubJson<GitHubReadmeApiResponse>(`/repos/${owner}/${repo}/readme`);
    if (!raw?.content) return null;
    if (raw.encoding && raw.encoding !== "base64") return null;
    const decoded = safeBase64Decode(raw.content);
    return decoded.trim() ? decoded : null;
  } catch (err) {
    // If README is missing, GitHub returns 404; treat as no README.
    const httpErr = err as HttpError | undefined;
    if (httpErr instanceof HttpError && httpErr.statusCode === 404) return null;
    throw err;
  }
}

export function validateGitHubSlug(slug: string): boolean {
  // GitHub owner/repo slugs are typically alnum plus . _ -
  return /^[A-Za-z0-9._-]{1,100}$/.test(slug);
}

export async function getRepoSnapshot(params: { owner: string; repo: string }): Promise<GitHubRepo> {
  const owner = params.owner.trim();
  const repo = params.repo.trim();

  if (!validateGitHubSlug(owner) || !validateGitHubSlug(repo)) {
    throw new HttpError({
      statusCode: 400,
      publicMessage: "Invalid repository identifier.",
      internalMessage: "Invalid owner/repo slug",
      details: { owner, repo }
    });
  }

  const cacheKey = `repo:${owner}/${repo}`.toLowerCase();
  const cached = repoCache.get(cacheKey);
  if (cached && cached.expiresAt > nowMs()) return cached.value;

  const [repoR, languages, readme] = await Promise.all([
    fetchRepo(owner, repo),
    fetchLanguages(owner, repo),
    fetchReadme(owner, repo)
  ]);

  const normalized: GitHubRepo = {
    name: repoR.name,
    fullName: repoR.full_name,
    htmlUrl: repoR.html_url,
    description: repoR.description ?? null,
    languages,
    stars: Number(repoR.stargazers_count ?? 0),
    forks: Number(repoR.forks_count ?? 0),
    updatedAt: repoR.updated_at,
    defaultBranch: repoR.default_branch,
    readme,
    topics: Array.isArray(repoR.topics) ? repoR.topics.map((t) => String(t)) : []
  };

  repoCache.set(cacheKey, { value: normalized, expiresAt: nowMs() + getCacheTtlMs() });
  return normalized;
}

