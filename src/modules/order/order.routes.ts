import { Router } from "express";

import { authenticate, authorize } from "../../middleware/auth.js";
import * as orderController from "./order.controller.js";

export const orderRoutes = Router();

orderRoutes.use(authenticate, authorize("CUSTOMER"));

orderRoutes.post("/", orderController.placeOrder);
orderRoutes.get("/", orderController.listOrders);
orderRoutes.get("/:id", orderController.getOrder);
