import { GoogleGenerativeAI } from "@google/generative-ai";
import { getEnv } from "../config/env";
import { HttpError } from "../errors/httpError";
import type { ToneAnalysis } from "@readyrepo/shared";

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

export async function generateTextWithGemini(params: {
  prompt: string;
  temperature?: number;
}): Promise<string> {
  const env = getEnv();
  if (!env.GEMINI_API_KEY) {
    throw new HttpError({
      statusCode: 503,
      publicMessage: "AI service is not configured.",
      internalMessage: "Missing GEMINI_API_KEY"
    });
  }

  const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: env.GEMINI_MODEL,
    generationConfig: {
      temperature: params.temperature ?? 0.4
    }
  });

  try {
    const result = await withTimeout(model.generateContent(params.prompt), env.GEMINI_TIMEOUT_MS, "gemini");
    const text = result.response.text();
    return text?.trim() ?? "";
  } catch (err) {
    throw new HttpError({
      statusCode: 502,
      publicMessage: "AI service request failed.",
      internalMessage: "Gemini generateContent failed",
      details: { message: String((err as Error)?.message ?? err) }
    });
  }
}

