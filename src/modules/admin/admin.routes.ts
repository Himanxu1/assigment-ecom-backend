import { Router } from "express";

import { authenticate, authorize } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import * as adminController from "./admin.controller.js";
import { updateVendorStatusSchema } from "./admin.schema.js";

export const adminRoutes = Router();

adminRoutes.use(authenticate, authorize("ADMIN"));

adminRoutes.get("/vendors", adminController.listVendors);
adminRoutes.patch("/vendors/:id/status", validate(updateVendorStatusSchema), adminController.updateVendorStatus);
adminRoutes.get("/orders", adminController.listAllOrders);
