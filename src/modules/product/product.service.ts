import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../utils/AppError.js";
import { getOwnShop } from "../shop/shop.service.js";
import type { CreateProductInput, UpdateProductInput } from "./product.schema.js";

/**
 * Product ids come from the URL, so every lookup is filtered by the vendor's
 * own shop as well as the id. A product belonging to someone else reports 404
 * rather than 403, so the API does not confirm that the id exists.
 */
async function findOwnProduct(vendorId: string, productId: string) {
  const product = await prisma.product.findFirst({
    where: { id: productId, deletedAt: null, shop: { vendorId } },
  });
  if (!product) {
    throw new AppError(404, "Product not found");
  }
  return product;
}

export async function listOwnProducts(vendorId: string) {
  const shop = await getOwnShop(vendorId);
  return prisma.product.findMany({
    where: { shopId: shop.id, deletedAt: null },
    orderBy: { createdAt: "desc" },
  });
}

export async function createProduct(vendorId: string, input: CreateProductInput) {
  const shop = await getOwnShop(vendorId);
  return prisma.product.create({ data: { ...input, shopId: shop.id } });
}

export async function updateProduct(vendorId: string, productId: string, input: UpdateProductInput) {
  await findOwnProduct(vendorId, productId);
  return prisma.product.update({ where: { id: productId }, data: input });
}

/**
 * Soft delete: order history points at this row and must keep resolving.
 * The product is dropped from any open cart in the same transaction, so
 * nobody is left holding an item they can no longer order.
 */
export async function deleteProduct(vendorId: string, productId: string) {
  await findOwnProduct(vendorId, productId);
  await prisma.$transaction([
    prisma.product.update({ where: { id: productId }, data: { deletedAt: new Date() } }),
    prisma.cartItem.deleteMany({ where: { productId } }),
  ]);
}
