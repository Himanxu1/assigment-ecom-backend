import { z } from "zod";

/** Guards against a typo or a script turning into a 10,000-unit order. */
export const MAX_QUANTITY_PER_PRODUCT = 99;

export const addItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive().max(MAX_QUANTITY_PER_PRODUCT).default(1),
});

export const updateItemSchema = z.object({
  quantity: z.number().int().positive().max(MAX_QUANTITY_PER_PRODUCT),
});

export type AddItemInput = z.infer<typeof addItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
