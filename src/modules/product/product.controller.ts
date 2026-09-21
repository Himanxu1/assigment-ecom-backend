import type { RequestHandler } from "express";

import { currentUser } from "../../middleware/auth.js";
import * as productService from "./product.service.js";

type ProductParams = { id: string };

export const listOwnProducts: RequestHandler = async (req, res) => {
  res.json(await productService.listOwnProducts(currentUser(req).id));
};

export const createProduct: RequestHandler = async (req, res) => {
  res.status(201).json(await productService.createProduct(currentUser(req).id, req.body));
};

export const updateProduct: RequestHandler<ProductParams> = async (req, res) => {
  res.json(await productService.updateProduct(currentUser(req).id, req.params.id, req.body));
};

export const deleteProduct: RequestHandler<ProductParams> = async (req, res) => {
  await productService.deleteProduct(currentUser(req).id, req.params.id);
  res.status(204).send();
};
