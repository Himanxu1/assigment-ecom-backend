import { Router } from "express";

import { authenticate, authorize } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import * as cartController from "./cart.controller.js";
import { addItemSchema, updateItemSchema } from "./cart.schema.js";

export const cartRoutes = Router();

cartRoutes.use(authenticate, authorize("CUSTOMER"));

cartRoutes.get("/", cartController.getCart);
cartRoutes.delete("/", cartController.clearCart);
cartRoutes.post("/items", validate(addItemSchema), cartController.addItem);
cartRoutes.patch("/items/:productId", validate(updateItemSchema), cartController.updateItemQuantity);
cartRoutes.delete("/items/:productId", cartController.removeItem);
