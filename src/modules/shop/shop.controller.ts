import type { RequestHandler } from "express";

import { currentUser } from "../../middleware/auth.js";
import { nearbyQuerySchema } from "./shop.schema.js";
import * as shopService from "./shop.service.js";

export const getOwnShop: RequestHandler = async (req, res) => {
  res.json(await shopService.getOwnShop(currentUser(req).id));
};

export const createShop: RequestHandler = async (req, res) => {
  res.status(201).json(await shopService.createShop(currentUser(req).id, req.body));
};

export const updateShop: RequestHandler = async (req, res) => {
  res.json(await shopService.updateShop(currentUser(req).id, req.body));
};

export const findNearbyShops: RequestHandler = async (req, res) => {
  res.json(await shopService.findNearbyShops(nearbyQuerySchema.parse(req.query)));
};

export const getShopWithProducts: RequestHandler<{ id: string }> = async (req, res) => {
  res.json(await shopService.getShopWithProducts(req.params.id));
};
