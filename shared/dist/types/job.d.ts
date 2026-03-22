export interface JobPosting {
    url: string;
    title: string;
    company: string | null;
    description: string;
    requirements: string[];
    skills: string[];
    experienceLevel: string | null;
    rawText: string;
}
export type DetectedLanguage = "en" | "es" | "other";
export type ToneLabel = "formal" | "casual" | "innovative" | "corporate" | "startup";
export interface ToneAnalysis {
    sentiment: {
        score: number;
        magnitude: number;
    };
    tone: ToneLabel;
    toneDescriptors: string[];
    detectedLanguage: DetectedLanguage;
    confidence: number;
    culturalSignals: {
        keywords: string[];
        keywordSentiments: Record<string, number>;
    };
    contentCategories: Array<{
        name: string;
        confidence: number;
    }>;
    entities: Array<{
        name: string;
        type: string;
        salience: number;
    }>;
    analysisMetadata: {
        apiCallMade: boolean;
        cacheKey: string;
        analyzedAt: string;
    };
}
//# sourceMappingURL=job.d.ts.map