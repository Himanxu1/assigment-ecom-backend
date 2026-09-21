import type { RequestHandler } from "express";

import { currentUser } from "../../middleware/auth.js";
import * as cartService from "./cart.service.js";

type ItemParams = { productId: string };

export const getCart: RequestHandler = async (req, res) => {
  res.json(await cartService.getCart(currentUser(req).id));
};

export const addItem: RequestHandler = async (req, res) => {
  res.status(201).json(await cartService.addItem(currentUser(req).id, req.body));
};

export const updateItemQuantity: RequestHandler<ItemParams> = async (req, res) => {
  const cart = await cartService.updateItemQuantity(currentUser(req).id, req.params.productId, req.body.quantity);
  res.json(cart);
};

export const removeItem: RequestHandler<ItemParams> = async (req, res) => {
  res.json(await cartService.removeItem(currentUser(req).id, req.params.productId));
};

export const clearCart: RequestHandler = async (req, res) => {
  await cartService.clearCart(currentUser(req).id);
  res.status(204).send();
};
