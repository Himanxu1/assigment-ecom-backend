import { z } from "zod";

export const createProductSchema = z.object({
  title: z.string().trim().min(1).max(120),
  imageUrl: z.url().max(2048),
  // Prices are whole minor units (paise/cents) so money is never a float.
  priceCents: z.number().int().positive().max(10_000_000),
  isAvailable: z.boolean().default(true),
});

export const updateProductSchema = createProductSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, "Provide at least one field to update");

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
