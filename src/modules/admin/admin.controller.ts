import type { RequestHandler } from "express";

import * as adminService from "./admin.service.js";
import { listOrdersQuerySchema, listVendorsQuerySchema } from "./admin.schema.js";

export const listVendors: RequestHandler = async (req, res) => {
  res.json(await adminService.listVendors(listVendorsQuerySchema.parse(req.query)));
};

export const updateVendorStatus: RequestHandler<{ id: string }> = async (req, res) => {
  res.json(await adminService.updateVendorStatus(req.params.id, req.body));
};

export const listAllOrders: RequestHandler = async (req, res) => {
  res.json(await adminService.listAllOrders(listOrdersQuerySchema.parse(req.query)));
};
