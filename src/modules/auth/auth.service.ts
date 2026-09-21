import bcrypt from "bcrypt";

import type { User } from "../../generated/prisma/client.js";
import { signToken } from "../../lib/jwt.js";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../utils/AppError.js";
import type { LoginInput, RegisterInput } from "./auth.schema.js";

const SALT_ROUNDS = 10;

/** Everything about a user that is safe to send to a client. */
function publicUser(user: User) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
  };
}

export async function register(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new AppError(409, "Email already registered");
  }

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash: await bcrypt.hash(input.password, SALT_ROUNDS),
      role: input.role,
      // Vendors need an admin to approve them before they can sell.
      status: input.role === "VENDOR" ? "PENDING" : "APPROVED",
    },
  });

  return { token: signToken({ userId: user.id, role: user.role }), user: publicUser(user) };
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  // Same message either way, so this cannot be used to discover registered emails.
  const passwordMatches = user && (await bcrypt.compare(input.password, user.passwordHash));
  if (!user || !passwordMatches) {
    throw new AppError(401, "Invalid email or password");
  }

  if (user.status === "DISABLED" || user.status === "REJECTED") {
    throw new AppError(403, "This account is not active");
  }

  return { token: signToken({ userId: user.id, role: user.role }), user: publicUser(user) };
}

export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError(404, "User not found");
  }
  return publicUser(user);
}
