import { Router } from "express";

import { authRoutes } from "./modules/auth/auth.routes.js";

export const routes = Router();

routes.use("/auth", authRoutes);
