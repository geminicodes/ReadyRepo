import { GoogleGenerativeAI } from "@google/generative-ai";
import { getEnv } from "../config/env";
import { HttpError } from "../errors/httpError";
import type { ToneAnalysis } from "@readyrepo/shared";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
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

export function formatToneContextForPrompt(tone: ToneAnalysis | null | undefined) {
  if (!tone) return "Tone analysis unavailable.";
  const keywords = tone.culturalSignals.keywords.join(", ") || "none";
  return `Tone ${tone.tone} (confidence ${tone.confidence}), Cultural Keywords: ${keywords}, Sentiment: ${tone.sentiment.score}`;
}

function isRetriableGeminiError(err: unknown) {
  const msg = String((err as { message?: unknown } | null | undefined)?.message ?? err ?? "");
  // Common transient scenarios:
  // - 503 Service Unavailable / "high demand"
  // - 429 Too Many Requests / rate limit
  // - timeouts / network hiccups
  return (
    msg.includes("503") ||
    msg.toLowerCase().includes("service unavailable") ||
    msg.toLowerCase().includes("high demand") ||
    msg.includes("429") ||
    msg.toLowerCase().includes("too many requests") ||
    msg.toLowerCase().includes("resource exhausted") ||
    msg.toLowerCase().includes("timeout") ||
    msg.includes("ECONNRESET") ||
    msg.includes("ETIMEDOUT") ||
    msg.includes("ENOTFOUND")
  );
}

function parseFallbackModels(envValue: string | undefined) {
  if (!envValue) return [];
  return envValue
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function generateTextWithGemini(params: {
  prompt: string;
  temperature?: number;
  maxOutputTokens?: number;
  model?: string;
}): Promise<string> {
  const env = getEnv();
  if (!env.GEMINI_API_KEY) {
    throw new HttpError({
      statusCode: 503,
      publicMessage: "AI service is not configured.",
      internalMessage: "Missing GEMINI_API_KEY"
    });
  }

  const maxRetries = Math.max(0, Math.min(4, Math.floor(env.GEMINI_MAX_RETRIES ?? 2)));
  const baseModel = (params.model ?? env.GEMINI_MODEL).trim();
  const fallbacks = parseFallbackModels(env.GEMINI_FALLBACK_MODELS);
  const models = Array.from(new Set([baseModel, ...fallbacks])).filter(Boolean);

  const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

  let lastErr: unknown = null;
  const attempts: Array<{ model: string; attempts: number; lastError: string }> = [];

  for (const modelName of models) {
    let modelAttempts = 0;

    while (modelAttempts <= maxRetries) {
      modelAttempts += 1;
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            temperature: params.temperature ?? 0.4,
            // Keep output bounded to control latency/cost. Callers can override.
            maxOutputTokens: params.maxOutputTokens
          }
        });

        const result = await withTimeout(model.generateContent(params.prompt), env.GEMINI_TIMEOUT_MS, "gemini");
        const text = result.response.text();
        return text?.trim() ?? "";
      } catch (err) {
        lastErr = err;
        const msg = String((err as Error)?.message ?? err);
        if (!isRetriableGeminiError(err) || modelAttempts > maxRetries) {
          attempts.push({ model: modelName, attempts: modelAttempts, lastError: msg });
          break; // try next model (if any)
        }

        // Exponential backoff with small jitter.
        const backoff = Math.min(2500, 250 * 2 ** (modelAttempts - 1));
        const jitter = Math.floor(Math.random() * 150);
        await sleep(backoff + jitter);
      }
    }
  }

  throw new HttpError({
    statusCode: 502,
    publicMessage: "AI service request failed.",
    internalMessage: "Gemini generateContent failed",
    details: {
      message: String((lastErr as Error)?.message ?? lastErr),
      modelAttempts: attempts
    }
  });
}

