"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveAnalysis = saveAnalysis;
exports.getAnalysisHistory = getAnalysisHistory;
exports.getAnalysisById = getAnalysisById;
exports.saveGeneratedREADME = saveGeneratedREADME;
exports.getUserREADMEs = getUserREADMEs;
const firebase_1 = require("../config/firebase");
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
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
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
    return { id: snap.id, ...data };
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
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
//# sourceMappingURL=firestoreService.js.map