import { Router } from "express";

import { authenticate, requireApprovedVendor } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import * as shopController from "./shop.controller.js";
import { createShopSchema, updateShopSchema } from "./shop.schema.js";

export const shopRoutes = Router();

shopRoutes.use(authenticate, requireApprovedVendor);

shopRoutes.get("/", shopController.getOwnShop);
shopRoutes.post("/", validate(createShopSchema), shopController.createShop);
shopRoutes.patch("/", validate(updateShopSchema), shopController.updateShop);
