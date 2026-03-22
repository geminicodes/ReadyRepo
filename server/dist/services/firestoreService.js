"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveAnalysis = saveAnalysis;
exports.getAnalysisHistory = getAnalysisHistory;
exports.getAnalysisHistoryPage = getAnalysisHistoryPage;
exports.getAnalysisById = getAnalysisById;
exports.saveGeneratedREADME = saveGeneratedREADME;
exports.getUserREADMEs = getUserREADMEs;
exports.getUserREADMEsPage = getUserREADMEsPage;
const firebase_1 = require("../config/firebase");
function clampInt(input, opts) {
    const n = typeof input === "string" ? Number(input) : typeof input === "number" ? input : NaN;
    if (!Number.isFinite(n))
        return opts.fallback;
    const v = Math.floor(n);
    return Math.max(opts.min, Math.min(opts.max, v));
}
function toIsoIfTimestamp(v) {
    // Firestore Timestamp has `toDate()`; admin Timestamp also supports it.
    if (v && typeof v === "object" && typeof v.toDate === "function") {
        try {
            return v.toDate().toISOString();
        }
        catch {
            return v;
        }
    }
    return v;
}
function serializeDocData(data) {
    // Shallow serialization of timestamps commonly returned by our docs.
    const out = {};
    for (const [k, v] of Object.entries(data)) {
        out[k] = toIsoIfTimestamp(v);
    }
    return out;
}
async function saveAnalysis(params) {
    const db = (0, firebase_1.getFirestore)();
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
        createdAt: firebase_1.admin.firestore.FieldValue.serverTimestamp(),
        isPublic: Boolean(params.isPublic ?? false)
    });
    return { analysisId: ref.id };
}
async function getAnalysisHistory(userId, limit = 10) {
    const db = (0, firebase_1.getFirestore)();
    const snap = await db
        .collection("analyses")
        .where("userId", "==", userId)
        .orderBy("createdAt", "desc")
        .limit(limit)
        .get();
    return snap.docs.map((d) => ({ id: d.id, ...serializeDocData(d.data()) }));
}
async function getAnalysisHistoryPage(params) {
    const db = (0, firebase_1.getFirestore)();
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
    const items = snap.docs.map((d) => ({ id: d.id, ...serializeDocData(d.data()) }));
    const nextCursor = snap.docs.length === limit ? snap.docs[snap.docs.length - 1]?.id ?? null : null;
    return { items, nextCursor };
}
async function getAnalysisById(analysisId, userId) {
    const db = (0, firebase_1.getFirestore)();
    const snap = await db.collection("analyses").doc(analysisId).get();
    if (!snap.exists)
        return null;
    const data = snap.data();
    if (!data)
        return null;
    const ownerId = data["userId"];
    if (typeof ownerId !== "string" || ownerId !== userId)
        return null;
    return { id: snap.id, ...serializeDocData(data) };
}
async function saveGeneratedREADME(params) {
    const db = (0, firebase_1.getFirestore)();
    const now = firebase_1.admin.firestore.FieldValue.serverTimestamp();
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
async function getUserREADMEs(userId, limit = 20) {
    const db = (0, firebase_1.getFirestore)();
    const snap = await db
        .collection("readmes")
        .where("userId", "==", userId)
        .orderBy("createdAt", "desc")
        .limit(limit)
        .get();
    return snap.docs.map((d) => ({ id: d.id, ...serializeDocData(d.data()) }));
}
async function getUserREADMEsPage(params) {
    const db = (0, firebase_1.getFirestore)();
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
    const items = snap.docs.map((d) => ({ id: d.id, ...serializeDocData(d.data()) }));
    const nextCursor = snap.docs.length === limit ? snap.docs[snap.docs.length - 1]?.id ?? null : null;
    return { items, nextCursor };
}
//# sourceMappingURL=firestoreService.js.map