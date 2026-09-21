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

export const nearbyQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radiusKm: z.coerce.number().positive().max(50).default(5),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type NearbyQuery = z.infer<typeof nearbyQuerySchema>;
