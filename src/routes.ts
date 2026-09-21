import { Router } from "express";

import { adminRoutes } from "./modules/admin/admin.routes.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { cartRoutes } from "./modules/cart/cart.routes.js";
import { orderRoutes } from "./modules/order/order.routes.js";
import { productRoutes } from "./modules/product/product.routes.js";
import { publicShopRoutes, vendorShopRoutes } from "./modules/shop/shop.routes.js";

export const routes = Router();

routes.use("/auth", authRoutes);
routes.use("/admin", adminRoutes);
routes.use("/shops", publicShopRoutes);
routes.use("/cart", cartRoutes);
routes.use("/orders", orderRoutes);
routes.use("/vendor/shop", vendorShopRoutes);
routes.use("/vendor/products", productRoutes);
