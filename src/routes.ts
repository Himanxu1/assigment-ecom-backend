import { Router } from "express";

import { authRoutes } from "./modules/auth/auth.routes.js";
import { productRoutes } from "./modules/product/product.routes.js";
import { shopRoutes } from "./modules/shop/shop.routes.js";

export const routes = Router();

routes.use("/auth", authRoutes);
routes.use("/vendor/shop", shopRoutes);
routes.use("/vendor/products", productRoutes);
