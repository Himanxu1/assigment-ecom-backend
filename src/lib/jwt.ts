import jwt from "jsonwebtoken";

import { env } from "../config/env.js";
import type { Role } from "../generated/prisma/enums.js";

export type TokenPayload = {
  userId: string;
  role: Role;
};

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
}
