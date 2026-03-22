import { getEnv } from "../config/env";
import { HttpError } from "../errors/httpError";
import { validateGitHubSlug } from "./githubService";

type GitHubUserRepoApiResponse = {
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  default_branch: string;
  topics?: string[];
  fork?: boolean;
  archived?: boolean;
  disabled?: boolean;
};

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
      publicMessage: "GitHub user not found.",
      internalMessage: "GitHub user not found",
      details: { url }
    });
  }

  if (res.status === 401 || res.status === 403) {
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

export type UserRepoSummary = {
  owner: string;
  repo: string;
  fullName: string;
  htmlUrl: string;
  description: string | null;
  stars: number;
  forks: number;
  updatedAt: string;
  defaultBranch: string;
  topics: string[];
  fork: boolean;
  archived: boolean;
  disabled: boolean;
};

/**
 * Fetch a user's public repos (best-effort).
 * - Uses public endpoints (no OAuth on behalf of user)
 * - Filters out forks/archived/disabled by default (MVP signal quality)
 */
export async function getUserRepoSummaries(params: {
  username: string;
  limit?: number;
}): Promise<UserRepoSummary[]> {
  const username = params.username.trim();
  if (!validateGitHubSlug(username)) {
    throw new HttpError({
      statusCode: 400,
      publicMessage: "Invalid GitHub username.",
      internalMessage: "Invalid GitHub username slug",
      details: { username }
    });
  }

  const perPage = 100;
  const raw = await fetchGitHubJson<GitHubUserRepoApiResponse[]>(
    `/users/${encodeURIComponent(username)}/repos?per_page=${perPage}&sort=updated&direction=desc`
  );

  const cleaned = (raw ?? []).map((r) => ({
    owner: username,
    repo: r.name,
    fullName: r.full_name,
    htmlUrl: r.html_url,
    description: r.description ?? null,
    stars: Number(r.stargazers_count ?? 0),
    forks: Number(r.forks_count ?? 0),
    updatedAt: r.updated_at,
    defaultBranch: r.default_branch,
    topics: Array.isArray(r.topics) ? r.topics.map((t) => String(t)) : [],
    fork: Boolean(r.fork ?? false),
    archived: Boolean(r.archived ?? false),
    disabled: Boolean(r.disabled ?? false)
  }));

  // Prefer non-fork, non-archived, non-disabled repos for signal quality.
  const primary = cleaned.filter((r) => !r.fork && !r.archived && !r.disabled);
  const fallback = cleaned;

  const chosen = (primary.length >= 3 ? primary : fallback)
    .sort((a, b) => {
      // Heuristic: stars matter, but keep recent work relevant.
      const scoreA = a.stars * 2 + a.forks - Date.parse(a.updatedAt) / 1e12;
      const scoreB = b.stars * 2 + b.forks - Date.parse(b.updatedAt) / 1e12;
      return scoreB - scoreA;
    })
    .slice(0, Math.max(1, Math.min(50, Math.floor(params.limit ?? 12))));

  return chosen;
}

