"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeNaturalLanguageClient = initializeNaturalLanguageClient;
exports.extractCulturalKeywords = extractCulturalKeywords;
exports.detectCompanyCulture = detectCompanyCulture;
exports.analyzeJobTone = analyzeJobTone;
const node_crypto_1 = __importDefault(require("node:crypto"));
const language_1 = require("@google-cloud/language");
const env_1 = require("../config/env");
const toneCache_1 = require("../utils/toneCache");
let nlClient = null;
function isRecord(v) {
    return Boolean(v) && typeof v === "object" && !Array.isArray(v);
}
function initializeNaturalLanguageClient() {
    if (nlClient)
        return nlClient;
    const env = (0, env_1.getEnv)();
    const raw = env.GOOGLE_CLOUD_CREDENTIALS_JSON ?? env.GCP_SERVICE_ACCOUNT_JSON ?? undefined;
    const projectId = env.GOOGLE_CLOUD_PROJECT_ID ?? env.GCP_PROJECT_ID ?? undefined;
    if (!raw) {
        // Allow creation without creds; calls will fail and trigger fallback.
        nlClient = new language_1.LanguageServiceClient();
        return nlClient;
    }
    let creds;
    try {
        creds = JSON.parse(raw);
    }
    catch {
        // If it's not JSON, fall back to default ADC behavior.
        nlClient = new language_1.LanguageServiceClient();
        return nlClient;
    }
    // Service account JSON typically contains client_email/private_key.
    const client_email = isRecord(creds) && typeof creds["client_email"] === "string"
        ? String(creds["client_email"])
        : undefined;
    const private_key = isRecord(creds) && typeof creds["private_key"] === "string"
        ? String(creds["private_key"])
        : undefined;
    const credentials = client_email && private_key ? { client_email, private_key } : undefined;
    nlClient = new language_1.LanguageServiceClient({
        projectId: projectId ||
            (isRecord(creds) && typeof creds["project_id"] === "string"
                ? String(creds["project_id"])
                : undefined),
        credentials
    });
    return nlClient;
}
function sha256(input) {
    return node_crypto_1.default.createHash("sha256").update(input).digest("hex");
}
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
function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
}
function isRetriableError(err) {
    const e = err;
    const code = (e?.code ?? undefined);
    const message = String(e?.message ?? "");
    // google-gax: codes are numeric; 429 => 8 (RESOURCE_EXHAUSTED) sometimes
    if (code === 429 || code === 8)
        return true;
    if (code === 14 || code === 4)
        return true; // UNAVAILABLE / DEADLINE_EXCEEDED
    if (code === 13)
        return true; // INTERNAL
    // Network-ish
    if (message.includes("ENOTFOUND") ||
        message.includes("ECONNRESET") ||
        message.includes("ETIMEDOUT") ||
        message.includes("socket hang up")) {
        return true;
    }
    return false;
}
async function retry(fn, logger, label) {
    const maxRetries = 3;
    let attempt = 0;
    let lastErr;
    while (attempt <= maxRetries) {
        try {
            return await fn();
        }
        catch (err) {
            lastErr = err;
            if (!isRetriableError(err) || attempt === maxRetries)
                throw err;
            const backoff = Math.min(2000, 250 * 2 ** attempt);
            const jitter = Math.floor(Math.random() * 150);
            logger?.warn({ err, attempt, backoffMs: backoff + jitter }, `${label}_retry`);
            await sleep(backoff + jitter);
            attempt += 1;
        }
    }
    throw lastErr;
}
function detectLanguageHeuristic(text) {
    const t = ` ${text.toLowerCase()} `;
    const hasSpanishMarks = /[¡¿áéíóúñü]/i.test(text);
    const esHits = [" el ", " la ", " de ", " y ", " para ", " con ", " equipo ", " experiencia "].filter((w) => t.includes(w)).length;
    const enHits = [" the ", " and ", " with ", " experience ", " team ", " responsibilities ", " requirements "].filter((w) => t.includes(w)).length;
    if (hasSpanishMarks || esHits >= 3)
        return "es";
    if (enHits >= 3)
        return "en";
    return "other";
}
function normalizeEntities(entities) {
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
};
function extractCulturalKeywords(entities) {
    const high = entities.filter((e) => e.salience > 0.1).map((e) => e.name.toLowerCase());
    const allLists = Object.values(CULTURE_KEYWORDS).flat();
    const matched = new Set();
    for (const name of high) {
        for (const kw of allLists) {
            if (name.includes(kw))
                matched.add(kw);
        }
    }
    return Array.from(matched);
}
function detectCompanyCulture(params) {
    const { score, magnitude } = params.sentiment;
    const keywords = extractCulturalKeywords(params.entities);
    const entityText = params.entities.map((e) => e.name.toLowerCase()).join(" | ");
    const hasAny = (list) => list.some((k) => entityText.includes(k) || keywords.includes(k));
    // Rules from spec
    const startup = score > 0.3 && hasAny(CULTURE_KEYWORDS.startup);
    const corporate = score > -0.2 && score < 0.2 && hasAny(CULTURE_KEYWORDS.corporate);
    const innovative = score > 0.3 && hasAny(CULTURE_KEYWORDS.innovative);
    const formal = magnitude < 0.5 && hasAny(CULTURE_KEYWORDS.formal);
    const casual = score > 0.2 && hasAny(CULTURE_KEYWORDS.casual);
    let tone = "corporate";
    if (startup)
        tone = "startup";
    else if (innovative)
        tone = "innovative";
    else if (casual)
        tone = "casual";
    else if (formal)
        tone = "formal";
    else if (corporate)
        tone = "corporate";
    const descriptors = [];
    if (tone === "startup")
        descriptors.push("fast-paced", "ownership");
    if (tone === "innovative")
        descriptors.push("cutting-edge", "experimentation");
    if (tone === "corporate")
        descriptors.push("structured", "stakeholder-focused");
    if (tone === "formal")
        descriptors.push("professional", "process-driven");
    if (tone === "casual")
        descriptors.push("flexible", "friendly");
    // Confidence heuristic: sentiment strength + keyword signal density
    const base = Math.min(1, Math.max(0, Math.abs(score) * 0.7 + Math.min(1, magnitude / 2) * 0.3));
    const kwBoost = Math.min(0.25, keywords.length * 0.06);
    const confidence = Math.min(1, 0.45 + base * 0.4 + kwBoost);
    return { tone, descriptors, confidence, keywords };
}
function fallbackKeywordTone(text) {
    const t = text.toLowerCase();
    const has = (w) => t.includes(w);
    // Basic fallback rules, conservative
    if (has("mvp") || has("fast-paced") || has("agile"))
        return { tone: "startup", toneDescriptors: ["fast-paced"], confidence: 0.5 };
    if (has("enterprise") || has("compliance") || has("stakeholder"))
        return { tone: "corporate", toneDescriptors: ["structured"], confidence: 0.5 };
    if (has("cutting-edge") || has("research") || has("ai"))
        return { tone: "innovative", toneDescriptors: ["cutting-edge"], confidence: 0.5 };
    if (has("professional") || has("policy") || has("process"))
        return { tone: "formal", toneDescriptors: ["professional"], confidence: 0.5 };
    if (has("flexible") || has("fun") || has("relaxed"))
        return { tone: "casual", toneDescriptors: ["flexible"], confidence: 0.5 };
    return { tone: "corporate", toneDescriptors: ["structured"], confidence: 0.5 };
}
async function analyzeJobTone(description, jobUrl, logger) {
    const env = (0, env_1.getEnv)();
    const ttlHours = env.TONE_CACHE_TTL_HOURS ?? 24;
    const ttlMs = ttlHours * 60 * 60 * 1000;
    const normalizedUrl = (jobUrl ?? "").trim().toLowerCase();
    const cacheKey = `tone:${sha256(normalizedUrl || description.slice(0, 2000))}`;
    const cached = toneCache_1.toneCache.get(cacheKey);
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
        type: "PLAIN_TEXT",
        language: detectedLanguage === "other" ? undefined : detectedLanguage
    };
    const timeoutMs = 10_000;
    const sentimentP = retry(() => withTimeout(client.analyzeSentiment({ document }), timeoutMs, "nl_sentiment"), logger, "nl_sentiment");
    const entitiesP = retry(() => withTimeout(client.analyzeEntities({ document }), timeoutMs, "nl_entities"), logger, "nl_entities");
    // Classification is often language-limited; attempt and gracefully degrade.
    const classifyP = detectedLanguage === "en"
        ? retry(() => withTimeout(client.classifyText({ document }), timeoutMs, "nl_classify"), logger, "nl_classify")
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
            if (sentimentR.status !== "fulfilled")
                throw sentimentR.reason;
            const s = sentimentR.value?.[0]?.documentSentiment;
            const score = Number(s?.score ?? 0);
            const magnitude = Number(s?.magnitude ?? 0);
            if (!Number.isFinite(score) || !Number.isFinite(magnitude))
                throw new Error("invalid_sentiment");
            return { score, magnitude };
        })();
        // Entities
        const entities = (() => {
            if (entitiesR.status !== "fulfilled")
                throw entitiesR.reason;
            const raw = entitiesR.value?.[0]?.entities ?? [];
            return normalizeEntities(raw);
        })();
        // Categories (optional)
        const contentCategories = (() => {
            if (!classifyR || classifyR.status !== "fulfilled")
                return [];
            const first = classifyR.value?.[0];
            const categoriesRaw = isRecord(first) && Array.isArray(first["categories"])
                ? first["categories"]
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
        const keywordSentiments = {};
        for (const kw of culture.keywords)
            keywordSentiments[kw] = sentiment.score;
        const analysis = {
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
        toneCache_1.toneCache.set(cacheKey, analysis, ttlMs);
        logger?.info({ cacheKey, tone: analysis.tone, detectedLanguage }, "tone_analyzed");
        return analysis;
    }
    catch (err) {
        // Fallback to keyword detection (confidence=0.5)
        logger?.warn({ err, cacheKey }, "tone_analysis_failed_fallback");
        apiCallMade = false;
        const fb = fallbackKeywordTone(description);
        const analysis = {
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
        toneCache_1.toneCache.set(cacheKey, analysis, ttlMs);
        return analysis;
    }
}
//# sourceMappingURL=toneAnalyzer.js.map