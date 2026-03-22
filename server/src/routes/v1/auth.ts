import { Router } from "express";
import { HttpError } from "../../errors/httpError";
import { authenticateUser } from "../../middleware/auth";
import { getAuth } from "../../config/firebase";

/**
 * Auth utility endpoints.
 *
 * Mounted at `/api/v1/auth`.
 */
export function authRouter() {
  const router = Router();

  /**
   * Login endpoint (Firebase).
   *
   * In this architecture, the client performs Firebase Auth and obtains an ID token (JWT).
   * This endpoint is provided to validate the token and return basic session info.
   *
   * Expected:
   * - `Authorization: Bearer <Firebase ID token>`
   */
  router.post("/login", authenticateUser, async (req, res, next) => {
    try {
      const user = req.user;
      if (!user) {
        return next(
          new HttpError({
            statusCode: 401,
            publicMessage: "Authentication required.",
            internalMessage: "Missing req.user after authenticateUser"
          })
        );
      }

      res.json({
        success: true,
        data: {
          user: {
            uid: user.uid,
            email: user.email,
            tier: user.tier,
            displayName: user.displayName,
            photoURL: user.photoURL
          }
        }
      });
    } catch (err) {
      next(err);
    }
  });

  /**
   * Logout endpoint.
   *
   * Firebase logout is primarily client-side. This endpoint revokes refresh tokens so
   * the current session cannot be refreshed across devices.
   */
  router.post("/logout", authenticateUser, async (req, res, next) => {
    try {
      const user = req.user;
      if (!user) {
        return next(
          new HttpError({
            statusCode: 401,
            publicMessage: "Authentication required.",
            internalMessage: "Missing req.user after authenticateUser"
          })
        );
      }

      await getAuth().revokeRefreshTokens(user.uid);
      res.json({ success: true, data: { loggedOut: true } });
    } catch (err) {
      next(err);
    }
  });

  /**
   * Revoke all refresh tokens for the current user.
   *
   * This is used by the client "Sign out all devices" action.
   * It does not change the API contract of existing endpoints.
   */
  router.post("/revoke", authenticateUser, async (req, res, next) => {
    try {
      const user = req.user;
      if (!user) {
        return next(
          new HttpError({
            statusCode: 401,
            publicMessage: "Authentication required.",
            internalMessage: "Missing req.user after authenticateUser"
          })
        );
      }

      await getAuth().revokeRefreshTokens(user.uid);
      res.json({ success: true, data: { revoked: true } });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

