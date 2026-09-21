import type { RequestHandler } from "express";

import * as authService from "./auth.service.js";

export const register: RequestHandler = async (req, res) => {
  res.status(201).json(await authService.register(req.body));
};

export const login: RequestHandler = async (req, res) => {
  res.json(await authService.login(req.body));
};
