import type { RequestHandler } from "express";

import { currentUser } from "../../middleware/auth.js";
import * as authService from "./auth.service.js";

export const register: RequestHandler = async (req, res) => {
  res.status(201).json(await authService.register(req.body));
};

export const login: RequestHandler = async (req, res) => {
  res.json(await authService.login(req.body));
};

export const me: RequestHandler = async (req, res) => {
  res.json(await authService.getProfile(currentUser(req).id));
};
