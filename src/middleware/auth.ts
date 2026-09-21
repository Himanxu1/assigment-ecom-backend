import type { Request, RequestHandler } from "express";

import type { Role, UserStatus } from "../generated/prisma/enums.js";
import { verifyToken } from "../lib/jwt.js";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/AppError.js";

export type AuthUser = {
  id: string;
  role: Role;
  status: UserStatus;
};

/**
 * Reads the bearer token and loads the user.
 *
 * The user is re-read on every request rather than trusted from the token, so
 * that an admin disabling a vendor takes effect immediately instead of when
 * their token happens to expire.
 */
export const authenticate: RequestHandler = async (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw new AppError(401, "Missing bearer token");
  }

  let userId: string;
  try {
    userId = verifyToken(header.slice("Bearer ".length)).userId;
  } catch {
    throw new AppError(401, "Invalid or expired token");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, status: true },
  });

  // The token is valid but the account is gone.
  if (!user) {
    throw new AppError(401, "Invalid or expired token");
  }
  if (user.status === "DISABLED" || user.status === "REJECTED") {
    throw new AppError(403, "This account is not active");
  }

  req.user = user;
  next();
};

/** Reads the authenticated user, or fails loudly if `authenticate` was not mounted. */
export function currentUser(req: Request): AuthUser {
  if (!req.user) {
    throw new AppError(401, "Authentication required");
  }
  return req.user;
}

export function authorize(...roles: Role[]): RequestHandler {
  return (req, _res, next) => {
    if (!roles.includes(currentUser(req).role)) {
      throw new AppError(403, "You do not have access to this resource");
    }
    next();
  };
}

/** Vendor routes: a vendor still waiting on admin approval cannot sell yet. */
export const requireApprovedVendor: RequestHandler = (req, _res, next) => {
  const user = currentUser(req);
  if (user.role !== "VENDOR") {
    throw new AppError(403, "You do not have access to this resource");
  }
  if (user.status !== "APPROVED") {
    throw new AppError(403, "Your vendor account is awaiting admin approval");
  }
  next();
};
