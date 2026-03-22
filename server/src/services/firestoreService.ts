import type { AnalysisResult, ToneAnalysis } from "@readyrepo/shared";
import { admin, getFirestore } from "../config/firebase";

function clampInt(input: unknown, opts: { min: number; max: number; fallback: number }) {
  const n = typeof input === "string" ? Number(input) : typeof input === "number" ? input : NaN;
  if (!Number.isFinite(n)) return opts.fallback;
  const v = Math.floor(n);
  return Math.max(opts.min, Math.min(opts.max, v));
}

function toIsoIfTimestamp(v: unknown): unknown {
  // Firestore Timestamp has `toDate()`; admin Timestamp also supports it.
  if (v && typeof v === "object" && typeof (v as { toDate?: unknown }).toDate === "function") {
    try {
      return (v as { toDate: () => Date }).toDate().toISOString();
    } catch {
      return v;
    }
  }
  return v;
}

function serializeDocData(data: Record<string, unknown>): Record<string, unknown> {
  // Shallow serialization of timestamps commonly returned by our docs.
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    out[k] = toIsoIfTimestamp(v);
  }
  return out;
}

export async function saveAnalysis(params: {
  userId: string;
  githubUsername: string;
  jobUrl: string;
  jobTitle: string;
  analysisResult: AnalysisResult;
  toneAnalysis: ToneAnalysis;
  isPublic?: boolean;
}) {
  const db = getFirestore();
  const ref = await db.collection("analyses").add({
    userId: params.userId,
    githubUsername: params.githubUsername,
    jobUrl: params.jobUrl,
    jobTitle: params.jobTitle,
    overallScore: params.analysisResult.overallScore,
    scoreBreakdown: params.analysisResult.scoreBreakdown,
    strengths: params.analysisResult.strengths,
    gaps: params.analysisResult.gaps,
    recommendations: params.analysisResult.recommendations,
    repoScores: params.analysisResult.repoScores,
    toneAnalysis: params.toneAnalysis,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    isPublic: Boolean(params.isPublic ?? false)
  });

  return { analysisId: ref.id };
}

export async function getAnalysisHistory(userId: string, limit = 10) {
  const db = getFirestore();
  const snap = await db
    .collection("analyses")
    .where("userId", "==", userId)
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();

  return snap.docs.map((d) => ({ id: d.id, ...serializeDocData(d.data() as Record<string, unknown>) }));
}

export async function getAnalysisHistoryPage(params: {
  userId: string;
  limit?: unknown;
  cursor?: unknown; // doc id
}) {
  const db = getFirestore();
  const limit = clampInt(params.limit, { min: 1, max: 50, fallback: 10 });

  let q = db
    .collection("analyses")
    .where("userId", "==", params.userId)
    .orderBy("createdAt", "desc")
    .limit(limit);

  const cursor = typeof params.cursor === "string" && params.cursor.trim() ? params.cursor.trim() : null;
  if (cursor) {
    const cursorSnap = await db.collection("analyses").doc(cursor).get();
    if (cursorSnap.exists) {
      q = q.startAfter(cursorSnap);
    }
  }

  const snap = await q.get();
  const items = snap.docs.map((d) => ({ id: d.id, ...serializeDocData(d.data() as Record<string, unknown>) }));
  const nextCursor = snap.docs.length === limit ? snap.docs[snap.docs.length - 1]?.id ?? null : null;

  return { items, nextCursor };
}

export async function getAnalysisById(analysisId: string, userId: string) {
  const db = getFirestore();
  const snap = await db.collection("analyses").doc(analysisId).get();
  if (!snap.exists) return null;
  const data = snap.data();
  if (!data) return null;
  const ownerId = (data as Record<string, unknown>)["userId"];
  if (typeof ownerId !== "string" || ownerId !== userId) return null;
  return { id: snap.id, ...serializeDocData(data as Record<string, unknown>) };
}

export async function saveGeneratedREADME(params: {
  userId: string;
  analysisId: string | null;
  repoName: string;
  repoUrl: string;
  originalREADME: string | null;
  generatedREADME: string;
  tone: ToneAnalysis;
  jobContext: {
    jobUrl: string;
    jobTitle: string;
    company?: string | null;
  };
}) {
  const db = getFirestore();
  const now = admin.firestore.FieldValue.serverTimestamp();

  const ref = await db.collection("readmes").add({
    userId: params.userId,
    analysisId: params.analysisId,
    repoName: params.repoName,
    repoUrl: params.repoUrl,
    originalREADME: params.originalREADME,
    generatedREADME: params.generatedREADME,
    tone: params.tone,
    jobContext: params.jobContext,
    createdAt: now,
    lastEditedAt: now
  });

  return { readmeId: ref.id };
}

export async function getUserREADMEs(userId: string, limit = 20) {
  const db = getFirestore();
  const snap = await db
    .collection("readmes")
    .where("userId", "==", userId)
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();

  return snap.docs.map((d) => ({ id: d.id, ...serializeDocData(d.data() as Record<string, unknown>) }));
}

export async function getUserREADMEsPage(params: {
  userId: string;
  limit?: unknown;
  cursor?: unknown; // doc id
}) {
  const db = getFirestore();
  const limit = clampInt(params.limit, { min: 1, max: 50, fallback: 20 });

  let q = db
    .collection("readmes")
    .where("userId", "==", params.userId)
    .orderBy("createdAt", "desc")
    .limit(limit);

  const cursor = typeof params.cursor === "string" && params.cursor.trim() ? params.cursor.trim() : null;
  if (cursor) {
    const cursorSnap = await db.collection("readmes").doc(cursor).get();
    if (cursorSnap.exists) {
      q = q.startAfter(cursorSnap);
    }
  }

  const snap = await q.get();
  const items = snap.docs.map((d) => ({ id: d.id, ...serializeDocData(d.data() as Record<string, unknown>) }));
  const nextCursor = snap.docs.length === limit ? snap.docs[snap.docs.length - 1]?.id ?? null : null;
  return { items, nextCursor };
}

