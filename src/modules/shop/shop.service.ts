import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../utils/AppError.js";
import type { CreateShopInput, UpdateShopInput } from "./shop.schema.js";

/**
 * Every query here is keyed on the authenticated vendor's id, never on a shop
 * id from the request, so a vendor can only ever reach their own shop.
 */

export async function getOwnShop(vendorId: string) {
  const shop = await prisma.shop.findUnique({ where: { vendorId } });
  if (!shop) {
    throw new AppError(404, "You have not created a shop yet");
  }
  return shop;
}

export async function createShop(vendorId: string, input: CreateShopInput) {
  const existing = await prisma.shop.findUnique({ where: { vendorId } });
  if (existing) {
    throw new AppError(409, "You already have a shop");
  }
  return prisma.shop.create({ data: { ...input, vendorId } });
}

export async function updateShop(vendorId: string, input: UpdateShopInput) {
  await getOwnShop(vendorId);
  return prisma.shop.update({ where: { vendorId }, data: input });
}
