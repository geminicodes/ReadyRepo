"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.historyRouter = historyRouter;
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const httpError_1 = require("../../errors/httpError");
const firestoreService_1 = require("../../services/firestoreService");
/**
 * History endpoints (Pro tier only storage; reads require auth).
 *
 * Mounted at `/api/v1/history`.
 */
function historyRouter() {
    const router = (0, express_1.Router)();
    router.get("/", auth_1.authenticateUser, async (req, res, next) => {
        try {
            const user = req.user;
            const { items, nextCursor } = await (0, firestoreService_1.getAnalysisHistoryPage)({
                userId: user.uid,
                limit: req.query.limit,
                cursor: req.query.cursor
            });
            res.json({ success: true, data: { analyses: items, nextCursor } });
        }
        catch (err) {
            next(err);
        }
    });
    router.get("/analysis/:id", auth_1.authenticateUser, async (req, res, next) => {
        try {
            const user = req.user;
            const id = String(req.params.id);
            const item = await (0, firestoreService_1.getAnalysisById)(id, user.uid);
            if (!item) {
                return next(new httpError_1.HttpError({
                    statusCode: 404,
                    publicMessage: "Analysis not found.",
                    internalMessage: "Analysis not found or not owned by user"
                }));
            }
            res.json({ success: true, data: { analysis: item } });
        }
        catch (err) {
            next(err);
        }
    });
    router.get("/readmes", auth_1.authenticateUser, async (req, res, next) => {
        try {
            const user = req.user;
            const { items, nextCursor } = await (0, firestoreService_1.getUserREADMEsPage)({
                userId: user.uid,
                limit: req.query.limit,
                cursor: req.query.cursor
            });
            res.json({ success: true, data: { readmes: items, nextCursor } });
        }
        catch (err) {
            next(err);
        }
    });
    return router;
}
//# sourceMappingURL=history.js.map