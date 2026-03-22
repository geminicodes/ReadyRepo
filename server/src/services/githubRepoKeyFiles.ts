import { LRUCache } from "lru-cache";
import type pino from "pino";
import { getEnv } from "../config/env";
import { HttpError } from "../errors/httpError";
import { fetchGitHubJson, safeBase64Decode, validateGitHubSlug } from "./githubService";

type GitHubContentListingItem = {
  type: "file" | "dir" | "symlink" | "submodule";
  name: string;
  path: string;
  size?: number;
};

type GitHubContentFile = {
  type: "file";
  name: string;
  path: string;
  size?: number;
  content?: string;
  encoding?: string;
};

type KeyFileForPrompt = {
  path: string;
  kind: string;
  sizeBytes: number | null;
  summary: unknown | null;
  excerpt: string | null;
  truncated: boolean;
};

export type RepoKeyInputsForPrompt = {
  structure: { rootFiles: string[]; rootDirs: string[] };
  keyFiles: KeyFileForPrompt[];
  fetchedAt: string;
};

type CacheEntry = { value: RepoKeyInputsForPrompt; expiresAt: number };
const keyFilesCache = new LRUCache<string, CacheEntry>({ max: 500 });

function nowMs() {
  return Date.now();
}

function getCacheTtlMs() {
  const env = getEnv();
  return env.GITHUB_CACHE_TTL_MS ?? 300_000;
}

function truncate(input: string, maxChars: number) {
  const t = (input ?? "").trim();
  if (t.length <= maxChars) return { text: t, truncated: false };
  const head = t.slice(0, Math.max(0, maxChars - 20)).trim();
  return { text: `${head}\n\n[TRUNCATED]`, truncated: true };
}

function encodePath(path: string) {
  return path
    .split("/")
    .filter(Boolean)
    .map((p) => encodeURIComponent(p))
    .join("/");
}

async function fetchContentsJson(owner: string, repo: string, path: string, ref: string) {
  const encoded = encodePath(path);
  const suffix = encoded ? `/contents/${encoded}` : "/contents";
  const qs = ref ? `?ref=${encodeURIComponent(ref)}` : "";
  return fetchGitHubJson<unknown>(`/repos/${owner}/${repo}${suffix}${qs}`);
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return Boolean(v) && typeof v === "object" && !Array.isArray(v);
}

function asListingItem(v: unknown): GitHubContentListingItem | null {
  if (!isRecord(v)) return null;
  const type = String(v["type"] ?? "");
  if (type !== "file" && type !== "dir" && type !== "symlink" && type !== "submodule") return null;
  const name = String(v["name"] ?? "").trim();
  const path = String(v["path"] ?? "").trim();
  const size = typeof v["size"] === "number" ? Number(v["size"]) : undefined;
  if (!name || !path) return null;
  return { type: type as GitHubContentListingItem["type"], name, path, size };
}

function asFile(v: unknown): GitHubContentFile | null {
  if (!isRecord(v)) return null;
  const type = String(v["type"] ?? "");
  if (type !== "file") return null;
  const name = String(v["name"] ?? "").trim();
  const path = String(v["path"] ?? "").trim();
  const size = typeof v["size"] === "number" ? Number(v["size"]) : undefined;
  const content = typeof v["content"] === "string" ? String(v["content"]) : undefined;
  const encoding = typeof v["encoding"] === "string" ? String(v["encoding"]) : undefined;
  if (!name || !path) return null;
  return { type: "file", name, path, size, content, encoding };
}

function summarizePackageJson(raw: string) {
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const pickKeys = (obj: unknown, max: number) =>
      isRecord(obj) ? Object.keys(obj).slice(0, max) : [];

    return {
      name: typeof parsed["name"] === "string" ? parsed["name"] : undefined,
      private: typeof parsed["private"] === "boolean" ? parsed["private"] : undefined,
      packageManager: typeof parsed["packageManager"] === "string" ? parsed["packageManager"] : undefined,
      workspaces: Boolean(parsed["workspaces"]),
      engines: isRecord(parsed["engines"]) ? parsed["engines"] : undefined,
      scripts: pickKeys(parsed["scripts"], 12),
      dependencies: pickKeys(parsed["dependencies"], 25),
      devDependencies: pickKeys(parsed["devDependencies"], 25)
    };
  } catch {
    return null;
  }
}

function summarizeRequirementsTxt(raw: string) {
  const pkgs = raw
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#") && !l.startsWith("-"))
    .map((l) => l.split(/[<>=\s]/)[0].trim())
    .filter(Boolean);
  return { packages: Array.from(new Set(pkgs)).slice(0, 30) };
}

function inferKind(path: string) {
  const p = path.toLowerCase();
  if (p.endsWith("package.json")) return "package.json";
  if (p.endsWith("requirements.txt")) return "requirements.txt";
  if (p.endsWith("pyproject.toml")) return "pyproject.toml";
  if (p.endsWith("dockerfile")) return "Dockerfile";
  if (p.endsWith("docker-compose.yml") || p.endsWith("compose.yaml") || p.endsWith("compose.yml")) return "compose";
  if (p.endsWith("makefile")) return "Makefile";
  if (p.includes(".env.example") || p.includes(".env.sample")) return "env-example";
  if (p.endsWith("go.mod")) return "go.mod";
  if (p.endsWith("cargo.toml")) return "Cargo.toml";
  return "text";
}

async function fetchTextFile(params: {
  owner: string;
  repo: string;
  ref: string;
  path: string;
  maxBytes: number;
}): Promise<{ path: string; sizeBytes: number | null; text: string; truncated: boolean } | null> {
  const json = await fetchContentsJson(params.owner, params.repo, params.path, params.ref);
  const file = asFile(json);
  if (!file) return null;
  const sizeBytes = Number.isFinite(file.size ?? NaN) ? Number(file.size) : null;
  if (sizeBytes !== null && sizeBytes > params.maxBytes) {
    // Too large to include; skip entirely.
    return null;
  }
  if (!file.content || file.encoding !== "base64") return null;
  const decoded = safeBase64Decode(file.content);
  const t = truncate(decoded, 1400);
  return { path: file.path, sizeBytes, text: t.text, truncated: t.truncated };
}

async function tryFetchTextFile(
  params: { owner: string; repo: string; ref: string; path: string; maxBytes: number },
  logger?: pino.Logger
) {
  try {
    return await fetchTextFile(params);
  } catch (err) {
    // Missing file is OK; other errors should be surfaced to caller for warnings.
    const httpErr = err as HttpError | undefined;
    if (httpErr instanceof HttpError && httpErr.statusCode === 404) return null;
    logger?.warn({ err, path: params.path }, "github_keyfile_fetch_failed");
    throw err;
  }
}

function selectCandidatePaths(rootFiles: string[], rootDirs: string[]) {
  const filesSet = new Set(rootFiles.map((f) => f.toLowerCase()));
  const dirsSet = new Set(rootDirs.map((d) => d.toLowerCase()));

  const rootCandidates = [
    "package.json",
    "pyproject.toml",
    "requirements.txt",
    "Dockerfile",
    "docker-compose.yml",
    "compose.yaml",
    "Makefile",
    ".env.example",
    ".env.sample",
    "go.mod",
    "Cargo.toml"
  ];

  const selected: string[] = [];
  for (const p of rootCandidates) {
    if (filesSet.has(p.toLowerCase())) selected.push(p);
    if (selected.length >= 6) break;
  }

  // If the repo has a common backend folder, attempt a single nested manifest.
  const maybeBackendDir = ["server", "backend", "api"].find((d) => dirsSet.has(d));
  if (maybeBackendDir) {
    selected.push(`${maybeBackendDir}/package.json`);
    selected.push(`${maybeBackendDir}/requirements.txt`);
  }

  // De-dupe, cap to keep prompt small.
  return Array.from(new Set(selected)).slice(0, 8);
}

export async function getRepoKeyInputsForPrompt(params: {
  fullName: string;
  defaultBranch: string;
  logger?: pino.Logger;
}): Promise<RepoKeyInputsForPrompt> {
  const fullName = params.fullName.trim();
  const [ownerRaw, repoRaw] = fullName.split("/");
  const owner = (ownerRaw ?? "").trim();
  const repo = (repoRaw ?? "").trim();

  if (!validateGitHubSlug(owner) || !validateGitHubSlug(repo)) {
    throw new HttpError({
      statusCode: 400,
      publicMessage: "Invalid repository identifier.",
      internalMessage: "Invalid owner/repo slug",
      details: { fullName }
    });
  }

  const ref = (params.defaultBranch ?? "").trim() || "main";
  const cacheKey = `keyfiles:${owner}/${repo}@${ref}`.toLowerCase();
  const cached = keyFilesCache.get(cacheKey);
  if (cached && cached.expiresAt > nowMs()) return cached.value;

  const fetchedAt = new Date().toISOString();

  // Root structure listing
  const rootJson = await fetchContentsJson(owner, repo, "", ref);
  const listing: GitHubContentListingItem[] = Array.isArray(rootJson)
    ? (rootJson.map(asListingItem).filter(Boolean) as GitHubContentListingItem[])
    : [];

  const rootFiles = listing
    .filter((i) => i.type === "file")
    .map((i) => i.name)
    .slice(0, 80);
  const rootDirs = listing
    .filter((i) => i.type === "dir")
    .map((i) => i.name)
    .slice(0, 80);

  const candidatePaths = selectCandidatePaths(rootFiles, rootDirs);

  const keyFiles: KeyFileForPrompt[] = [];
  for (const path of candidatePaths) {
    const fetched = await tryFetchTextFile({ owner, repo, ref, path, maxBytes: 80_000 }, params.logger);
    if (!fetched) continue;

    const kind = inferKind(path);
    let summary: unknown | null = null;
    if (kind === "package.json") summary = summarizePackageJson(fetched.text);
    else if (kind === "requirements.txt") summary = summarizeRequirementsTxt(fetched.text);

    keyFiles.push({
      path: fetched.path,
      kind,
      sizeBytes: fetched.sizeBytes,
      summary,
      excerpt: fetched.text || null,
      truncated: fetched.truncated
    });
  }

  const value: RepoKeyInputsForPrompt = {
    structure: {
      rootFiles: rootFiles.slice(0, 50),
      rootDirs: rootDirs.slice(0, 50)
    },
    keyFiles,
    fetchedAt
  };

  keyFilesCache.set(cacheKey, { value, expiresAt: nowMs() + getCacheTtlMs() });
  return value;
}

