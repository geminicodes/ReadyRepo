import type { GenerateReadmeRequest, GenerateReadmeResponse, GitHubRepo, JobPosting, ToneAnalysis } from "@readyrepo/shared";
import { HttpError } from "../errors/httpError";
import { formatToneContextForPrompt, generateTextWithGemini } from "./geminiService";
import { analyzeJobTone } from "./toneAnalyzer";

function isSubstantialRepo(repo: GitHubRepo, readme: string | null | undefined) {
  const readmeLen = (readme ?? "").trim().length;
  const hasSignals =
    Boolean(repo.description?.trim()) ||
    repo.languages.length > 0 ||
    repo.topics.length > 0 ||
    readmeLen >= 200;

  return { ok: hasSignals, readmeLen };
}

function normalizeUrl(raw: string) {
  return raw.trim().replace(/^<|>$/g, "");
}

function isAllowedLink(url: string, allowed: Set<string>) {
  if (!url) return false;
  if (url.startsWith("#")) return true; // in-doc anchors are OK
  if (url.startsWith("mailto:")) return true;
  return allowed.has(url);
}

function sanitizeMarkdownLinks(params: {
  markdown: string;
  allowedLinks: Set<string>;
}): { markdown: string; removed: string[] } {
  const removed: string[] = [];

  // Inline links/images: [text](url) and ![alt](url)
  const inlineLinkRe = /(!?\[[^\]]*\])\(([^)]+)\)/g;
  let out = params.markdown.replace(inlineLinkRe, (match, label, urlRaw) => {
    const url = normalizeUrl(String(urlRaw));
    if (isAllowedLink(url, params.allowedLinks)) return match;
    removed.push(url);
    return label; // drop the URL, keep visible label
  });

  // Reference-style definitions: [id]: url
  const refDefRe = /^\s*\[[^\]]+\]:\s+(\S+)\s*$/gm;
  out = out.replace(refDefRe, (match, urlRaw) => {
    const url = normalizeUrl(String(urlRaw));
    if (isAllowedLink(url, params.allowedLinks)) return match;
    removed.push(url);
    return ""; // remove the definition
  });

  // Autolinks: <https://...>
  const autoLinkRe = /<((https?:\/\/)[^>\s]+)>/g;
  out = out.replace(autoLinkRe, (match, urlRaw) => {
    const url = normalizeUrl(String(urlRaw));
    if (isAllowedLink(url, params.allowedLinks)) return match;
    removed.push(url);
    return ""; // remove the autolink entirely
  });

  return { markdown: out.trim(), removed: Array.from(new Set(removed)).filter(Boolean) };
}

function buildAllowedLinks(repo: GitHubRepo, job: JobPosting) {
  const allowed = new Set<string>();

  // Always allow the repo URL + common GitHub subpaths.
  const base = repo.htmlUrl.replace(/\/$/, "");
  allowed.add(base);
  allowed.add(`${base}/issues`);
  allowed.add(`${base}/pulls`);
  allowed.add(`${base}/actions`);
  allowed.add(`${base}/releases`);
  allowed.add(`${base}/blob/${repo.defaultBranch}/README.md`);
  allowed.add(`${base}/blob/${repo.defaultBranch}/LICENSE`);

  // Allow job URL if present.
  if (job.url) allowed.add(job.url);

  return allowed;
}

export function buildReadmeGenerationPrompt(params: {
  repo: GitHubRepo;
  currentReadme: string | null;
  job: JobPosting;
  toneAnalysis?: ToneAnalysis | null;
}) {
  const { repo, currentReadme, job, toneAnalysis } = params;
  const existing = (currentReadme ?? "").trim();

  const repoSummary = {
    name: repo.name,
    fullName: repo.fullName,
    description: repo.description,
    htmlUrl: repo.htmlUrl,
    defaultBranch: repo.defaultBranch,
    topics: repo.topics,
    languages: repo.languages,
    stars: repo.stars,
    forks: repo.forks,
    updatedAt: repo.updatedAt
  };

  // Prompt is intentionally "single-purpose": README generation only.
  return [
    `You are a technical documentation expert specializing in GitHub READMEs.`,
    `Your goal is to generate an enhanced, recruiter-friendly README for a repository.`,
    ``,
    `CRITICAL RULES (no exceptions):`,
    `- Stay strictly factual: only use information provided in REPOSITORY DATA and CURRENT README.`,
    `- Do NOT invent features, architecture, APIs, install commands, or links.`,
    `- Do NOT include external links unless they are explicitly provided in the input (repo URL or job URL).`,
    `- If the repo has minimal code or unclear purpose, add a short disclaimer and keep claims conservative.`,
    `- Output ONLY the final README in Markdown. No preamble, no analysis, no meta commentary.`,
    ``,
    `TARGET IMPACT: Make this README stand out to recruiters reviewing for "${job.title}".`,
    `Highlight skills/technologies that align with the job requirements, but only if supported by the repo data/README.`,
    `Generate README matching: ${formatToneContextForPrompt(toneAnalysis ?? null)}`,
    ``,
    `LENGTH: Aim for 300–500 words (excluding code blocks).`,
    ``,
    `README STRUCTURE (use these headings in this order):`,
    `1. # <Title> (use repo name or a better factual title)`,
    `2. > <One-line tagline>`,
    `3. ## Overview (2–3 sentences)`,
    `4. ## Key Features (3–5 bullets, factual)`,
    `5. ## Tech Stack (bullets; only from repo languages/topics/README)`,
    `6. ## Getting Started`,
    `   - ### Prerequisites`,
    `   - ### Installation (MUST include a fenced \`\`\`bash code block)`,
    `   - ### Usage (MUST include a fenced \`\`\`bash or \`\`\`text code block with an example)`,
    `7. ## Project Structure (brief, only if inferable from README/repo data; otherwise omit this section)`,
    `8. ## Contributing (short and welcoming)`,
    `9. ## License (only if explicitly mentioned; otherwise omit)`,
    ``,
    `INPUTS`,
    `REPOSITORY DATA (JSON):`,
    JSON.stringify(repoSummary, null, 2),
    ``,
    `CURRENT README (${existing ? "verbatim" : "none"}):`,
    existing ? existing : "none",
    ``,
    `TARGET JOB (verbatim):`,
    JSON.stringify(
      {
        url: job.url,
        title: job.title,
        company: job.company,
        requirements: job.requirements,
        skills: job.skills,
        experienceLevel: job.experienceLevel,
        description: job.description
      },
      null,
      2
    )
  ].join("\n");
}

export async function generateEnhancedReadme(
  input: GenerateReadmeRequest
): Promise<GenerateReadmeResponse> {
  const currentReadme = (input.currentReadme ?? input.repo.readme ?? null) as string | null;
  const substantial = isSubstantialRepo(input.repo, currentReadme);

  if (!substantial.ok) {
    throw new HttpError({
      statusCode: 422,
      publicMessage: "Repository does not have enough content to generate a strong README.",
      internalMessage: "Repo not substantial enough for README generation",
      details: {
        signals: {
          hasDescription: Boolean(input.repo.description),
          languages: input.repo.languages.length,
          topics: input.repo.topics.length,
          readmeLength: substantial.readmeLen
        }
      }
    });
  }

  let toneAnalysis: ToneAnalysis | null = null;
  try {
    toneAnalysis = await analyzeJobTone(input.job.description, input.job.url);
  } catch {
    toneAnalysis = null;
  }

  const prompt = buildReadmeGenerationPrompt({
    repo: input.repo,
    currentReadme,
    job: input.job,
    toneAnalysis
  });

  const raw = await generateTextWithGemini({ prompt, temperature: 0.4 });
  if (!raw) {
    throw new HttpError({
      statusCode: 502,
      publicMessage: "AI service returned an empty response.",
      internalMessage: "Gemini returned empty text"
    });
  }

  const allowedLinks = buildAllowedLinks(input.repo, input.job);
  const sanitized = sanitizeMarkdownLinks({ markdown: raw, allowedLinks });

  const warnings: string[] = [];
  if (sanitized.removed.length > 0) {
    warnings.push(
      `Removed ${sanitized.removed.length} link(s) not present in the provided repo/job data.`
    );
  }

  // If the repo is borderline, ensure we inform the user.
  if ((currentReadme ?? "").trim().length < 80 && !input.repo.description?.trim()) {
    warnings.push("Repo has minimal description/README; generated README may be conservative.");
  }

  return { generatedReadme: sanitized.markdown, warnings };
}

