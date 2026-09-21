import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../utils/AppError.js";
import type { ListOrdersQuery, ListVendorsQuery, UpdateVendorStatusInput } from "./admin.schema.js";

const vendorShape = {
  select: {
    id: true,
    name: true,
    email: true,
    status: true,
    createdAt: true,
    shop: {
      select: { id: true, name: true, address: true, latitude: true, longitude: true, isOpen: true },
    },
  },
} as const;

export function listVendors(query: ListVendorsQuery) {
  return prisma.user.findMany({
    where: { role: "VENDOR", ...(query.status ? { status: query.status } : {}) },
    orderBy: { createdAt: "desc" },
    ...vendorShape,
  });
}

/**
 * Approve, reject or disable a vendor.
 *
 * The lookup is filtered by `role: "VENDOR"`, so this endpoint cannot be used
 * to disable a customer or another admin — only the accounts it is meant for.
 */
export async function updateVendorStatus(vendorId: string, input: UpdateVendorStatusInput) {
  const vendor = await prisma.user.findFirst({ where: { id: vendorId, role: "VENDOR" } });
  if (!vendor) {
    throw new AppError(404, "Vendor not found");
  }

  return prisma.user.update({
    where: { id: vendorId },
    data: { status: input.status },
    ...vendorShape,
  });
}

/** Every order on the platform, newest first. Paged so this cannot grow unbounded. */
export async function listAllOrders(query: ListOrdersQuery) {
  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: query.limit,
      skip: query.offset,
      include: {
        customer: { select: { id: true, name: true, email: true } },
        shop: { select: { id: true, name: true } },
        items: { select: { productId: true, title: true, priceCents: true, quantity: true } },
      },
    }),
    prisma.order.count(),
  ]);

  return { total, limit: query.limit, offset: query.offset, orders };
}
