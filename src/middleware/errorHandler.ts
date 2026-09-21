import type { ErrorRequestHandler, RequestHandler } from "express";
import { z, ZodError } from "zod";

import { Prisma } from "../generated/prisma/client.js";
import { AppError } from "../utils/AppError.js";

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({ message: `Cannot ${req.method} ${req.path}` });
};

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof AppError) {
    res.status(error.status).json({ message: error.message });
    return;
  }

  if (error instanceof ZodError) {
    // formErrors holds whole-object messages (e.g. "provide at least one field"),
    // fieldErrors holds the per-field ones.
    const { formErrors, fieldErrors } = z.flattenError(error);
    res.status(400).json({
      message: formErrors[0] ?? "Validation failed",
      errors: fieldErrors,
    });
    return;
  }

  // Unique constraint, e.g. registering an email that already exists.
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    res.status(409).json({ message: "Already exists" });
    return;
  }

  // Unexpected: log the real error, tell the client nothing.
  console.error(error);
  res.status(500).json({ message: "Something went wrong" });
};
