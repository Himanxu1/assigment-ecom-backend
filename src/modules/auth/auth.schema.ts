import { z } from "zod";

// Trim and lowercase before validating, so " Asha@Example.com " is accepted and
// stored as one canonical value. Email lookups are then plain equality checks.
const email = z.string().trim().toLowerCase().pipe(z.email());

export const registerSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email,
  // bcrypt only reads the first 72 bytes, so anything longer is a false sense of security.
  password: z.string().min(8).max(72),
  // ADMIN is deliberately not accepted here; admins are seeded, never self-registered.
  role: z.enum(["CUSTOMER", "VENDOR"]),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
