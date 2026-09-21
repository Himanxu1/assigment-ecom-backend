import { z } from "zod";

export const createShopSchema = z.object({
  name: z.string().trim().min(1).max(120),
  address: z.string().trim().min(1).max(255),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const updateShopSchema = createShopSchema
  .extend({ isOpen: z.boolean() })
  .partial()
  .refine((data) => Object.keys(data).length > 0, "Provide at least one field to update");

export type CreateShopInput = z.infer<typeof createShopSchema>;
export type UpdateShopInput = z.infer<typeof updateShopSchema>;
