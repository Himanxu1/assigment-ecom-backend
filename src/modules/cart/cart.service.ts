import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../utils/AppError.js";
import { MAX_QUANTITY_PER_PRODUCT, type AddItemInput } from "./cart.schema.js";

/**
 * A customer has at most one cart and it belongs to a single shop, which the
 * `customerId @unique` + `shopId` columns enforce. Adding from a second shop is
 * refused rather than silently replacing the cart, so nothing is lost without
 * the customer asking; DELETE /cart is the explicit way to start over.
 */

/** Reads the cart with prices joined in. An absent cart reads as an empty one. */
export async function getCart(customerId: string) {
  const cart = await prisma.cart.findUnique({
    where: { customerId },
    include: {
      shop: { select: { id: true, name: true, isOpen: true } },
      items: {
        include: {
          product: { select: { id: true, title: true, imageUrl: true, priceCents: true, isAvailable: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!cart) {
    return { shop: null, items: [], totalCents: 0 };
  }

  const items = cart.items.map((item) => ({
    productId: item.product.id,
    title: item.product.title,
    imageUrl: item.product.imageUrl,
    priceCents: item.product.priceCents,
    isAvailable: item.product.isAvailable,
    quantity: item.quantity,
    lineTotalCents: item.product.priceCents * item.quantity,
  }));

  return {
    shop: cart.shop,
    items,
    totalCents: items.reduce((sum, item) => sum + item.lineTotalCents, 0),
  };
}

async function requireCart(customerId: string) {
  const cart = await prisma.cart.findUnique({ where: { customerId } });
  if (!cart) {
    throw new AppError(404, "Your cart is empty");
  }
  return cart;
}

export async function addItem(customerId: string, input: AddItemInput) {
  // Only a sellable product from an approved vendor can enter a cart.
  const product = await prisma.product.findFirst({
    where: {
      id: input.productId,
      deletedAt: null,
      isAvailable: true,
      shop: { vendor: { status: "APPROVED" } },
    },
    select: { id: true, shopId: true },
  });
  if (!product) {
    throw new AppError(404, "Product is not available");
  }

  const existingCart = await prisma.cart.findUnique({ where: { customerId } });
  if (existingCart && existingCart.shopId !== product.shopId) {
    throw new AppError(409, "Your cart already has items from another shop. Clear it first.");
  }

  const cart = existingCart ?? (await prisma.cart.create({ data: { customerId, shopId: product.shopId } }));

  const cartId_productId = { cartId: cart.id, productId: product.id };
  const existingItem = await prisma.cartItem.findUnique({ where: { cartId_productId } });

  // Adding a product already in the cart tops up its quantity.
  const quantity = (existingItem?.quantity ?? 0) + input.quantity;
  if (quantity > MAX_QUANTITY_PER_PRODUCT) {
    throw new AppError(400, `You can order at most ${MAX_QUANTITY_PER_PRODUCT} of a product`);
  }

  await prisma.cartItem.upsert({
    where: { cartId_productId },
    create: { ...cartId_productId, quantity },
    update: { quantity },
  });

  return getCart(customerId);
}

export async function updateItemQuantity(customerId: string, productId: string, quantity: number) {
  const cart = await requireCart(customerId);

  const item = await prisma.cartItem.findUnique({
    where: { cartId_productId: { cartId: cart.id, productId } },
  });
  if (!item) {
    throw new AppError(404, "That product is not in your cart");
  }

  await prisma.cartItem.update({ where: { id: item.id }, data: { quantity } });
  return getCart(customerId);
}

export async function removeItem(customerId: string, productId: string) {
  const cart = await requireCart(customerId);

  const removed = await prisma.cartItem.deleteMany({ where: { cartId: cart.id, productId } });
  if (removed.count === 0) {
    throw new AppError(404, "That product is not in your cart");
  }

  // An empty cart should not keep the customer tied to that shop.
  const remaining = await prisma.cartItem.count({ where: { cartId: cart.id } });
  if (remaining === 0) {
    await prisma.cart.delete({ where: { id: cart.id } });
  }

  return getCart(customerId);
}

export async function clearCart(customerId: string) {
  await prisma.cart.deleteMany({ where: { customerId } });
}
