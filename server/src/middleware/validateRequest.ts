import type { RequestHandler } from "express";
import { validationResult } from "express-validator";
import { HttpError } from "../errors/httpError";

/**
 * Convert express-validator errors into a single safe 400 response.
 */
export const validateRequest: RequestHandler = (req, _res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const details = result.array({ onlyFirstError: true }).map((e) => ({
    field: e.type === "field" ? e.path : e.type,
    message: e.msg
  }));

  return next(
    new HttpError({
      statusCode: 400,
      publicMessage: "Invalid request.",
      internalMessage: "Request validation failed",
      details: { errors: details }
    })
  );
};
