"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatToneContextForPrompt = formatToneContextForPrompt;
exports.generateTextWithGemini = generateTextWithGemini;
const generative_ai_1 = require("@google/generative-ai");
const env_1 = require("../config/env");
const httpError_1 = require("../errors/httpError");
function withTimeout(p, timeoutMs, label) {
    return new Promise((resolve, reject) => {
        const t = setTimeout(() => reject(new Error(`${label}_timeout`)), timeoutMs);
        p.then((v) => {
            clearTimeout(t);
            resolve(v);
        }, (e) => {
            clearTimeout(t);
            reject(e);
        });
    });
}
function formatToneContextForPrompt(tone) {
    if (!tone)
        return "Tone analysis unavailable.";
    const keywords = tone.culturalSignals.keywords.join(", ") || "none";
    return `Tone ${tone.tone} (confidence ${tone.confidence}), Cultural Keywords: ${keywords}, Sentiment: ${tone.sentiment.score}`;
}
async function generateTextWithGemini(params) {
    const env = (0, env_1.getEnv)();
    if (!env.GEMINI_API_KEY) {
        throw new httpError_1.HttpError({
            statusCode: 503,
            publicMessage: "AI service is not configured.",
            internalMessage: "Missing GEMINI_API_KEY"
        });
    }
    const genAI = new generative_ai_1.GoogleGenerativeAI(env.GEMINI_API_KEY);
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
    }
    catch (err) {
        throw new httpError_1.HttpError({
            statusCode: 502,
            publicMessage: "AI service request failed.",
            internalMessage: "Gemini generateContent failed",
            details: { message: String(err?.message ?? err) }
        });
    }
}
//# sourceMappingURL=geminiService.js.map