import type { RequestHandler } from "express";
import type { ZodType } from "zod";

/** Replaces req.body with the parsed value, so handlers get trusted input. */
export function validate(schema: ZodType): RequestHandler {
  return (req, _res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
}
