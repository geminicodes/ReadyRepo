import crypto from "node:crypto";
import { LanguageServiceClient } from "@google-cloud/language";
import type pino from "pino";
import type { DetectedLanguage, ToneAnalysis, ToneLabel } from "@readyrepo/shared";
import { getEnv } from "../config/env";
import { toneCache } from "../utils/toneCache";

type NlEntity = { name?: string | null; type?: string | null; salience?: number | null };

let nlClient: LanguageServiceClient | null = null;

function isRecord(v: unknown): v is Record<string, unknown> {
  return Boolean(v) && typeof v === "object" && !Array.isArray(v);
}

export function initializeNaturalLanguageClient(): LanguageServiceClient {
  if (nlClient) return nlClient;

  const env = getEnv();
  const raw = env.GOOGLE_CLOUD_CREDENTIALS_JSON ?? env.GCP_SERVICE_ACCOUNT_JSON ?? undefined;
  const projectId = env.GOOGLE_CLOUD_PROJECT_ID ?? env.GCP_PROJECT_ID ?? undefined;

  if (!raw) {
    // Allow creation without creds; calls will fail and trigger fallback.
    nlClient = new LanguageServiceClient();
    return nlClient;
  }

  let creds: unknown;
  try {
    creds = JSON.parse(raw);
  } catch {
    // If it's not JSON, fall back to default ADC behavior.
    nlClient = new LanguageServiceClient();
    return nlClient;
  }

  // Service account JSON typically contains client_email/private_key.
  const client_email =
    isRecord(creds) && typeof creds["client_email"] === "string"
      ? String(creds["client_email"])
      : undefined;
  const private_key =
    isRecord(creds) && typeof creds["private_key"] === "string"
      ? String(creds["private_key"])
      : undefined;
  const credentials =
    client_email && private_key ? { client_email, private_key } : undefined;

  nlClient = new LanguageServiceClient({
    projectId:
      projectId ||
      (isRecord(creds) && typeof creds["project_id"] === "string"
        ? String(creds["project_id"])
        : undefined),
    credentials
  });

  return nlClient;
}

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
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

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function isRetriableError(err: unknown) {
  const e = err as { code?: unknown; message?: unknown } | null | undefined;
  const code = (e?.code ?? undefined) as number | string | undefined;
  const message = String(e?.message ?? "");

  // google-gax: codes are numeric; 429 => 8 (RESOURCE_EXHAUSTED) sometimes
  if (code === 429 || code === 8) return true;
  if (code === 14 || code === 4) return true; // UNAVAILABLE / DEADLINE_EXCEEDED
  if (code === 13) return true; // INTERNAL

  // Network-ish
  if (
    message.includes("ENOTFOUND") ||
    message.includes("ECONNRESET") ||
    message.includes("ETIMEDOUT") ||
    message.includes("socket hang up")
  ) {
    return true;
  }
  return false;
}

async function retry<T>(fn: () => Promise<T>, logger: pino.Logger | undefined, label: string) {
  const maxRetries = 3;
  let attempt = 0;
  let lastErr: unknown;

  while (attempt <= maxRetries) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (!isRetriableError(err) || attempt === maxRetries) throw err;

      const backoff = Math.min(2000, 250 * 2 ** attempt);
      const jitter = Math.floor(Math.random() * 150);
      logger?.warn({ err, attempt, backoffMs: backoff + jitter }, `${label}_retry`);
      await sleep(backoff + jitter);
      attempt += 1;
    }
  }

  throw lastErr;
}

function detectLanguageHeuristic(text: string): DetectedLanguage {
  const t = ` ${text.toLowerCase()} `;
  const hasSpanishMarks = /[¡¿áéíóúñü]/i.test(text);
  const esHits = [" el ", " la ", " de ", " y ", " para ", " con ", " equipo ", " experiencia "].filter(
    (w) => t.includes(w)
  ).length;
  const enHits = [" the ", " and ", " with ", " experience ", " team ", " responsibilities ", " requirements "].filter(
    (w) => t.includes(w)
  ).length;

  if (hasSpanishMarks || esHits >= 3) return "es";
  if (enHits >= 3) return "en";
  return "other";
}

function normalizeEntities(entities: NlEntity[]) {
  return entities
    .map((e) => ({
      name: String(e.name ?? "").trim(),
      type: String(e.type ?? "").trim(),
      salience: Number(e.salience ?? 0)
    }))
    .filter((e) => e.name);
}

const CULTURE_KEYWORDS = {
  startup: ["fast-paced", "agile", "mvp", "0 to 1", "scrappy", "ownership"],
  corporate: ["enterprise", "fortune 500", "stakeholders", "compliance", "governance"],
  innovative: ["cutting-edge", "ai", "research", "ml", "innovation", "experimentation"],
  formal: ["professional", "established", "policy", "process", "documentation"],
  casual: ["flexible", "fun", "relaxed", "friendly", "work-life"]
} as const;

export function extractCulturalKeywords(entities: Array<{ name: string; salience: number }>) {
  const high = entities.filter((e) => e.salience > 0.1).map((e) => e.name.toLowerCase());
  const allLists = Object.values(CULTURE_KEYWORDS).flat();
  const matched = new Set<string>();

  for (const name of high) {
    for (const kw of allLists) {
      if (name.includes(kw)) matched.add(kw);
    }
  }

  return Array.from(matched);
}

export function detectCompanyCulture(params: {
  entities: Array<{ name: string; salience: number }>;
  sentiment: { score: number; magnitude: number };
}): { tone: ToneLabel; descriptors: string[]; confidence: number; keywords: string[] } {
  const { score, magnitude } = params.sentiment;
  const keywords = extractCulturalKeywords(params.entities);
  const entityText = params.entities.map((e) => e.name.toLowerCase()).join(" | ");

  const hasAny = (list: readonly string[]) => list.some((k) => entityText.includes(k) || keywords.includes(k));

  // Rules from spec
  const startup = score > 0.3 && hasAny(CULTURE_KEYWORDS.startup);
  const corporate = score > -0.2 && score < 0.2 && hasAny(CULTURE_KEYWORDS.corporate);
  const innovative = score > 0.3 && hasAny(CULTURE_KEYWORDS.innovative);
  const formal = magnitude < 0.5 && hasAny(CULTURE_KEYWORDS.formal);
  const casual = score > 0.2 && hasAny(CULTURE_KEYWORDS.casual);

  let tone: ToneLabel = "corporate";
  if (startup) tone = "startup";
  else if (innovative) tone = "innovative";
  else if (casual) tone = "casual";
  else if (formal) tone = "formal";
  else if (corporate) tone = "corporate";

  const descriptors: string[] = [];
  if (tone === "startup") descriptors.push("fast-paced", "ownership");
  if (tone === "innovative") descriptors.push("cutting-edge", "experimentation");
  if (tone === "corporate") descriptors.push("structured", "stakeholder-focused");
  if (tone === "formal") descriptors.push("professional", "process-driven");
  if (tone === "casual") descriptors.push("flexible", "friendly");

  // Confidence heuristic: sentiment strength + keyword signal density
  const base = Math.min(1, Math.max(0, Math.abs(score) * 0.7 + Math.min(1, magnitude / 2) * 0.3));
  const kwBoost = Math.min(0.25, keywords.length * 0.06);
  const confidence = Math.min(1, 0.45 + base * 0.4 + kwBoost);

  return { tone, descriptors, confidence, keywords };
}

function fallbackKeywordTone(text: string): Pick<ToneAnalysis, "tone" | "toneDescriptors" | "confidence"> {
  const t = text.toLowerCase();
  const has = (w: string) => t.includes(w);

  // Basic fallback rules, conservative
  if (has("mvp") || has("fast-paced") || has("agile")) return { tone: "startup", toneDescriptors: ["fast-paced"], confidence: 0.5 };
  if (has("enterprise") || has("compliance") || has("stakeholder")) return { tone: "corporate", toneDescriptors: ["structured"], confidence: 0.5 };
  if (has("cutting-edge") || has("research") || has("ai")) return { tone: "innovative", toneDescriptors: ["cutting-edge"], confidence: 0.5 };
  if (has("professional") || has("policy") || has("process")) return { tone: "formal", toneDescriptors: ["professional"], confidence: 0.5 };
  if (has("flexible") || has("fun") || has("relaxed")) return { tone: "casual", toneDescriptors: ["flexible"], confidence: 0.5 };
  return { tone: "corporate", toneDescriptors: ["structured"], confidence: 0.5 };
}

export async function analyzeJobTone(
  description: string,
  jobUrl: string,
  logger?: pino.Logger
): Promise<ToneAnalysis> {
  const env = getEnv();
  const ttlHours = env.TONE_CACHE_TTL_HOURS ?? 24;
  const ttlMs = ttlHours * 60 * 60 * 1000;

  const normalizedUrl = (jobUrl ?? "").trim().toLowerCase();
  const cacheKey = `tone:${sha256(normalizedUrl || description.slice(0, 2000))}`;

  const cached = toneCache.get(cacheKey) as ToneAnalysis | undefined;
  if (cached) {
    logger?.info({ cacheKey }, "tone_cache_hit");
    return {
      ...cached,
      analysisMetadata: {
        ...cached.analysisMetadata,
        apiCallMade: false,
        cacheKey
      }
    };
  }

  logger?.info({ cacheKey }, "tone_cache_miss");

  const detectedLanguage = detectLanguageHeuristic(description);
  const client = initializeNaturalLanguageClient();
  const analyzedAt = new Date().toISOString();

  const document = {
    content: description,
    type: "PLAIN_TEXT" as const,
    language: detectedLanguage === "other" ? undefined : detectedLanguage
  };

  const timeoutMs = 10_000;

  const sentimentP = retry(
    () =>
      withTimeout(
        client.analyzeSentiment({ document }),
        timeoutMs,
        "nl_sentiment"
      ),
    logger,
    "nl_sentiment"
  );

  const entitiesP = retry(
    () =>
      withTimeout(
        client.analyzeEntities({ document }),
        timeoutMs,
        "nl_entities"
      ),
    logger,
    "nl_entities"
  );

  // Classification is often language-limited; attempt and gracefully degrade.
  const classifyP =
    detectedLanguage === "en"
      ? retry(
          () =>
            withTimeout(
              client.classifyText({ document }),
              timeoutMs,
              "nl_classify"
            ),
          logger,
          "nl_classify"
        )
      : Promise.resolve(null);

  let apiCallMade = true;

  try {
    const [sentimentR, entitiesR, classifyR] = await Promise.allSettled([
      sentimentP,
      entitiesP,
      classifyP
    ]);

    // Sentiment
    const sentiment = (() => {
      if (sentimentR.status !== "fulfilled") throw sentimentR.reason;
      const s = sentimentR.value?.[0]?.documentSentiment;
      const score = Number(s?.score ?? 0);
      const magnitude = Number(s?.magnitude ?? 0);
      if (!Number.isFinite(score) || !Number.isFinite(magnitude)) throw new Error("invalid_sentiment");
      return { score, magnitude };
    })();

    // Entities
    const entities = (() => {
      if (entitiesR.status !== "fulfilled") throw entitiesR.reason;
      const raw = entitiesR.value?.[0]?.entities ?? [];
      return normalizeEntities(raw as NlEntity[]);
    })();

    // Categories (optional)
    const contentCategories = (() => {
      if (!classifyR || classifyR.status !== "fulfilled") return [];
      const first = classifyR.value?.[0] as unknown;
      const categoriesRaw = isRecord(first) && Array.isArray(first["categories"])
        ? (first["categories"] as unknown[])
        : [];

      return categoriesRaw
        .map((c) => {
          const name = isRecord(c) ? String(c["name"] ?? "").trim() : "";
          const confidence = isRecord(c) ? Number(c["confidence"] ?? 0) : 0;
          return { name, confidence };
        })
        .filter((c) => c.name);
    })();

    const culture = detectCompanyCulture({
      entities: entities.map((e) => ({ name: e.name, salience: e.salience })),
      sentiment
    });

    const keywordSentiments: Record<string, number> = {};
    for (const kw of culture.keywords) keywordSentiments[kw] = sentiment.score;

    const analysis: ToneAnalysis = {
      sentiment,
      tone: culture.tone,
      toneDescriptors: culture.descriptors,
      detectedLanguage,
      confidence: culture.confidence,
      culturalSignals: { keywords: culture.keywords, keywordSentiments },
      contentCategories,
      entities,
      analysisMetadata: { apiCallMade, cacheKey, analyzedAt }
    };

    toneCache.set(cacheKey, analysis, ttlMs);
    logger?.info({ cacheKey, tone: analysis.tone, detectedLanguage }, "tone_analyzed");
    return analysis;
  } catch (err) {
    // Fallback to keyword detection (confidence=0.5)
    logger?.warn({ err, cacheKey }, "tone_analysis_failed_fallback");
    apiCallMade = false;
    const fb = fallbackKeywordTone(description);
    const analysis: ToneAnalysis = {
      sentiment: { score: 0, magnitude: 0 },
      tone: fb.tone,
      toneDescriptors: fb.toneDescriptors,
      detectedLanguage,
      confidence: fb.confidence,
      culturalSignals: { keywords: [], keywordSentiments: {} },
      contentCategories: [],
      entities: [],
      analysisMetadata: { apiCallMade, cacheKey, analyzedAt }
    };
    toneCache.set(cacheKey, analysis, ttlMs);
    return analysis;
  }
}

