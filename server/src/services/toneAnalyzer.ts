import crypto from "node:crypto";
import type pino from "pino";
import type { DetectedLanguage, ToneAnalysis, ToneLabel } from "@readyrepo/shared";
import { getEnv } from "../config/env";
import { toneCache } from "../utils/toneCache";
import { generateTextWithGemini } from "./geminiService";

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
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

function truncate(input: string, maxChars: number) {
  const t = (input ?? "").trim();
  if (t.length <= maxChars) return t;
  return `${t.slice(0, Math.max(0, maxChars - 20)).trim()}\n\n[TRUNCATED]`;
}

function clamp(n: number, min: number, max: number) {
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

function extractJsonObject(text: string): unknown {
  const t = String(text ?? "").trim();
  if (!t) throw new Error("empty_response");

  // Strip common Markdown fences.
  const unfenced = t.replace(/^```(?:json)?\s*/i, "").replace(/```$/i, "").trim();
  const start = unfenced.indexOf("{");
  const end = unfenced.lastIndexOf("}");
  if (start < 0 || end < 0 || end <= start) throw new Error("no_json_object");
  const slice = unfenced.slice(start, end + 1);
  return JSON.parse(slice) as unknown;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return Boolean(v) && typeof v === "object" && !Array.isArray(v);
}

function toToneLabel(v: unknown): ToneLabel | null {
  const s = String(v ?? "").trim().toLowerCase();
  if (s === "formal" || s === "casual" || s === "innovative" || s === "corporate" || s === "startup") return s;
  return null;
}

function toDetectedLanguage(v: unknown): DetectedLanguage | null {
  const s = String(v ?? "").trim().toLowerCase();
  if (s === "en" || s === "es" || s === "other") return s;
  return null;
}

function parseGeminiToneResult(raw: string, fallbackLanguage: DetectedLanguage) {
  const obj = extractJsonObject(raw);
  if (!isRecord(obj)) throw new Error("invalid_json_shape");

  const detectedLanguage = toDetectedLanguage(obj["detectedLanguage"]) ?? fallbackLanguage;
  const tone = toToneLabel(obj["tone"]) ?? null;
  const toneDescriptors = Array.isArray(obj["toneDescriptors"])
    ? obj["toneDescriptors"].map((x) => String(x ?? "").trim()).filter(Boolean).slice(0, 4)
    : [];
  const confidence = clamp(Number(obj["confidence"] ?? 0), 0, 1);

  const sentimentScore = clamp(Number(obj["sentimentScore"] ?? 0), -1, 1);
  const sentimentMagnitude = clamp(Number(obj["sentimentMagnitude"] ?? 0), 0, 1);

  const culturalKeywords = Array.isArray(obj["culturalKeywords"])
    ? obj["culturalKeywords"].map((x) => String(x ?? "").trim()).filter(Boolean).slice(0, 8)
    : [];

  if (!tone) throw new Error("missing_tone");
  return {
    detectedLanguage,
    tone,
    toneDescriptors: toneDescriptors.length > 0 ? toneDescriptors : [tone],
    confidence: confidence || 0.6,
    sentiment: { score: sentimentScore, magnitude: sentimentMagnitude },
    culturalKeywords
  };
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
  const analyzedAt = new Date().toISOString();

  try {
    const trimmed = truncate(description, 8_000);
    const prompt = [
      "You are analyzing the communication tone of a job posting.",
      "Return ONLY valid JSON (no markdown, no extra text).",
      "Use the following enums exactly:",
      'detectedLanguage: "en" | "es" | "other"',
      'tone: "formal" | "casual" | "innovative" | "corporate" | "startup"',
      "",
      "JSON schema:",
      "{",
      '  "detectedLanguage": "en|es|other",',
      '  "tone": "formal|casual|innovative|corporate|startup",',
      '  "toneDescriptors": ["short", "phrases"],',
      '  "confidence": 0.0,',
      '  "sentimentScore": 0.0,',
      '  "sentimentMagnitude": 0.0,',
      '  "culturalKeywords": ["keyword1", "keyword2"]',
      "}",
      "",
      "Rules:",
      "- toneDescriptors: 1–4 items, <= 3 words each.",
      "- culturalKeywords: 0–8 items, short, directly present or strongly implied by the text.",
      "- sentimentScore range [-1,1], sentimentMagnitude range [0,1].",
      "",
      "JOB_DESCRIPTION:",
      "<<<",
      trimmed,
      ">>>"
    ].join("\n");

    const raw = await generateTextWithGemini({
      prompt,
      temperature: 0.1,
      maxOutputTokens: 350
    });

    const parsed = parseGeminiToneResult(raw, detectedLanguage);
    const keywordSentiments: Record<string, number> = {};
    for (const kw of parsed.culturalKeywords) keywordSentiments[kw] = parsed.sentiment.score;

    const analysis: ToneAnalysis = {
      sentiment: parsed.sentiment,
      tone: parsed.tone,
      toneDescriptors: parsed.toneDescriptors,
      detectedLanguage: parsed.detectedLanguage,
      confidence: parsed.confidence,
      culturalSignals: { keywords: parsed.culturalKeywords, keywordSentiments },
      // Keep these fields for compatibility; we intentionally keep them empty to save tokens.
      contentCategories: [],
      entities: [],
      analysisMetadata: { apiCallMade: true, cacheKey, analyzedAt }
    };

    toneCache.set(cacheKey, analysis, ttlMs);
    logger?.info({ cacheKey, tone: analysis.tone, detectedLanguage: analysis.detectedLanguage }, "tone_analyzed");
    return analysis;
  } catch (err) {
    // Fallback to keyword detection (confidence=0.5)
    logger?.warn({ err, cacheKey }, "tone_analysis_failed_fallback");
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
      analysisMetadata: { apiCallMade: false, cacheKey, analyzedAt }
    };
    toneCache.set(cacheKey, analysis, ttlMs);
    return analysis;
  }
}

