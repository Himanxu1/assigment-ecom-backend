import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../utils/AppError.js";
import { boundingBox } from "../../utils/geo.js";
import type { CreateShopInput, NearbyQuery, UpdateShopInput } from "./shop.schema.js";

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

/* ------------------------------------------------------------------ *
 * Customer-facing discovery. Only shops of APPROVED vendors are ever
 * visible, so rejecting or disabling a vendor hides their shop at once.
 * ------------------------------------------------------------------ */

type NearbyShop = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  isOpen: boolean;
  distanceKm: number;
};

/**
 * Nearby shops, closest first.
 *
 * Two steps: a bounding box narrows candidates using the (latitude, longitude)
 * index, then the haversine great-circle distance filters and sorts precisely.
 * PostGIS would be the production answer; this keeps the stack to plain
 * PostgreSQL and is accurate to a few metres at city scale.
 */
export async function findNearbyShops(query: NearbyQuery): Promise<NearbyShop[]> {
  const { lat, lng, radiusKm, limit } = query;
  const box = boundingBox(lat, lng, radiusKm);

  return prisma.$queryRaw<NearbyShop[]>`
    SELECT
      t.id, t.name, t.address, t.latitude, t.longitude, t."isOpen",
      ROUND(t."distanceKm"::numeric, 3)::float8 AS "distanceKm"
    FROM (
      SELECT
        s.id, s.name, s.address, s.latitude, s.longitude, s."isOpen",
        6371 * acos(LEAST(1, GREATEST(-1,
          cos(radians(${lat})) * cos(radians(s.latitude))
            * cos(radians(s.longitude) - radians(${lng}))
          + sin(radians(${lat})) * sin(radians(s.latitude))
        ))) AS "distanceKm"
      FROM shops s
      JOIN users u ON u.id = s."vendorId"
      WHERE u.status = 'APPROVED'
        AND s.latitude BETWEEN ${box.minLat} AND ${box.maxLat}
        AND s.longitude BETWEEN ${box.minLng} AND ${box.maxLng}
    ) t
    WHERE t."distanceKm" <= ${radiusKm}
    ORDER BY t."distanceKm" ASC
    LIMIT ${limit}
  `;
}

/** A shop's catalogue. Unavailable items are returned so the UI can grey them out. */
export async function getShopWithProducts(shopId: string) {
  const shop = await prisma.shop.findFirst({
    where: { id: shopId, vendor: { status: "APPROVED" } },
    select: { id: true, name: true, address: true, latitude: true, longitude: true, isOpen: true },
  });
  if (!shop) {
    throw new AppError(404, "Shop not found");
  }

  const products = await prisma.product.findMany({
    where: { shopId, deletedAt: null },
    select: { id: true, title: true, imageUrl: true, priceCents: true, isAvailable: true },
    orderBy: { title: "asc" },
  });

  return { shop, products };
}
