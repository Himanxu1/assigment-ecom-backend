import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../utils/AppError.js";

const orderShape = {
  include: {
    shop: { select: { id: true, name: true } },
    items: { select: { productId: true, title: true, priceCents: true, quantity: true } },
  },
} as const;

/**
 * Turns the customer's cart into an order.
 *
 * The request carries no body at all: the line items, the prices and the total
 * are read from the database, so there is nothing for a client to tamper with.
 * Everything runs in one transaction, so either the order exists and the cart
 * is gone, or neither happened.
 */
export async function placeOrder(customerId: string) {
  return prisma.$transaction(async (tx) => {
    const cart = await tx.cart.findUnique({
      where: { customerId },
      include: {
        shop: { include: { vendor: { select: { status: true } } } },
        items: { include: { product: true } },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new AppError(400, "Your cart is empty");
    }

    if (cart.shop.vendor.status !== "APPROVED") {
      throw new AppError(409, "This shop is no longer accepting orders");
    }
    if (!cart.shop.isOpen) {
      throw new AppError(409, "This shop is currently closed");
    }

    // Prices and availability are re-read here, inside the transaction: the
    // vendor may have changed them while the cart was sitting around.
    const unavailable = cart.items.filter(
      (item) => item.product.deletedAt !== null || !item.product.isAvailable,
    );
    if (unavailable.length > 0) {
      const titles = unavailable.map((item) => item.product.title).join(", ");
      throw new AppError(409, `No longer available: ${titles}`);
    }

    const totalCents = cart.items.reduce(
      (sum, item) => sum + item.product.priceCents * item.quantity,
      0,
    );

    const order = await tx.order.create({
      data: {
        customerId,
        shopId: cart.shopId,
        totalCents,
        items: {
          // Title and price are copied in, so editing the product later
          // cannot rewrite what this customer agreed to pay.
          create: cart.items.map((item) => ({
            productId: item.productId,
            title: item.product.title,
            priceCents: item.product.priceCents,
            quantity: item.quantity,
          })),
        },
      },
      ...orderShape,
    });

    await tx.cart.delete({ where: { id: cart.id } });

    return order;
  });
}

export function listOrders(customerId: string) {
  return prisma.order.findMany({
    where: { customerId },
    orderBy: { createdAt: "desc" },
    ...orderShape,
  });
}

export async function getOrder(customerId: string, orderId: string) {
  // Scoped by customer, so one customer cannot read another's order by id.
  const order = await prisma.order.findFirst({
    where: { id: orderId, customerId },
    ...orderShape,
  });
  if (!order) {
    throw new AppError(404, "Order not found");
  }
  return order;
}
