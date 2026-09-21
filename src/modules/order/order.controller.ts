import type { RequestHandler } from "express";

import { currentUser } from "../../middleware/auth.js";
import * as orderService from "./order.service.js";

export const placeOrder: RequestHandler = async (req, res) => {
  res.status(201).json(await orderService.placeOrder(currentUser(req).id));
};

export const listOrders: RequestHandler = async (req, res) => {
  res.json(await orderService.listOrders(currentUser(req).id));
};

export const getOrder: RequestHandler<{ id: string }> = async (req, res) => {
  res.json(await orderService.getOrder(currentUser(req).id, req.params.id));
};
