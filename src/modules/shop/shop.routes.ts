import { Router } from "express";

import { authenticate, requireApprovedVendor } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import * as shopController from "./shop.controller.js";
import { createShopSchema, updateShopSchema } from "./shop.schema.js";

/** A vendor managing their own shop. */
export const vendorShopRoutes = Router();

vendorShopRoutes.use(authenticate, requireApprovedVendor);

vendorShopRoutes.get("/", shopController.getOwnShop);
vendorShopRoutes.post("/", validate(createShopSchema), shopController.createShop);
vendorShopRoutes.patch("/", validate(updateShopSchema), shopController.updateShop);

/** Public catalogue: no login needed to browse shops or their products. */
export const publicShopRoutes = Router();

publicShopRoutes.get("/nearby", shopController.findNearbyShops);
publicShopRoutes.get("/:id", shopController.getShopWithProducts);
