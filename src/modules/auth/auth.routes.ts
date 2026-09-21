import { Router } from "express";

import { validate } from "../../middleware/validate.js";
import * as authController from "./auth.controller.js";
import { loginSchema, registerSchema } from "./auth.schema.js";

export const authRoutes = Router();

authRoutes.post("/register", validate(registerSchema), authController.register);
authRoutes.post("/login", validate(loginSchema), authController.login);
