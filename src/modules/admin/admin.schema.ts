import { z } from "zod";

// PENDING is missing on purpose: a decision can be changed, but not un-made.
export const updateVendorStatusSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED", "DISABLED"]),
});

export const listVendorsQuerySchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "DISABLED"]).optional(),
});

export const listOrdersQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export type UpdateVendorStatusInput = z.infer<typeof updateVendorStatusSchema>;
export type ListVendorsQuery = z.infer<typeof listVendorsQuerySchema>;
export type ListOrdersQuery = z.infer<typeof listOrdersQuerySchema>;
