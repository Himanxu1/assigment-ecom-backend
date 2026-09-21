import bcrypt from "bcrypt";

import { prisma } from "../src/lib/prisma.js";
import type { Role, UserStatus } from "../src/generated/prisma/enums.js";

/**
 * Demo data for local development.
 *
 * Re-running this is safe: users are matched on their email and shops on their
 * vendor, and products are only created for a shop that has none yet (order
 * history holds references to products, so they are never deleted here).
 *
 * Every account below uses the same password: password123
 */

const PASSWORD = "password123";

async function upsertUser(email: string, name: string, role: Role, status: UserStatus) {
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  return prisma.user.upsert({
    where: { email },
    update: { name, role, status },
    create: { email, name, role, status, passwordHash },
  });
}

async function upsertShop(
  vendorId: string,
  shop: { name: string; address: string; latitude: number; longitude: number },
) {
  return prisma.shop.upsert({
    where: { vendorId },
    update: shop,
    create: { ...shop, vendorId },
  });
}

async function seedProducts(
  shopId: string,
  products: { title: string; priceCents: number; isAvailable?: boolean }[],
) {
  const existing = await prisma.product.count({ where: { shopId } });
  if (existing > 0) {
    return;
  }
  await prisma.product.createMany({
    data: products.map((product) => ({
      shopId,
      title: product.title,
      imageUrl: `https://placehold.co/300x300?text=${encodeURIComponent(product.title)}`,
      priceCents: product.priceCents,
      isAvailable: product.isAvailable ?? true,
    })),
  });
}

async function main() {
  await upsertUser("admin@hyperlocal.test", "Platform Admin", "ADMIN", "APPROVED");

  // Approved vendor, MG Road.
  const ravi = await upsertUser("ravi@hyperlocal.test", "Ravi Kumar", "VENDOR", "APPROVED");
  const raviShop = await upsertShop(ravi.id, {
    name: "Ravi Kirana Store",
    address: "14 MG Road, Bengaluru",
    latitude: 12.9716,
    longitude: 77.5946,
  });
  await seedProducts(raviShop.id, [
    { title: "Milk 1L", priceCents: 5500 },
    { title: "Brown Bread", priceCents: 4500 },
    { title: "Basmati Rice 5kg", priceCents: 42000 },
    { title: "Toor Dal 1kg", priceCents: 18000 },
    { title: "Sunflower Oil 1L", priceCents: 16500 },
    { title: "Farm Eggs (12)", priceCents: 9000, isAvailable: false },
  ]);

  // Approved vendor, Indiranagar, roughly 5 km from MG Road.
  const meena = await upsertUser("meena@hyperlocal.test", "Meena Rao", "VENDOR", "APPROVED");
  const meenaShop = await upsertShop(meena.id, {
    name: "Meena Fresh Mart",
    address: "220 100 Feet Road, Indiranagar, Bengaluru",
    latitude: 12.9784,
    longitude: 77.6408,
  });
  await seedProducts(meenaShop.id, [
    { title: "Tomatoes 1kg", priceCents: 4000 },
    { title: "Onions 1kg", priceCents: 3500 },
    { title: "Bananas (6)", priceCents: 6000 },
    { title: "Curd 500g", priceCents: 3500 },
    { title: "Paneer 200g", priceCents: 9900 },
  ]);

  // Waiting on approval: this shop must not appear in customer search yet.
  const arjun = await upsertUser("arjun@hyperlocal.test", "Arjun Shetty", "VENDOR", "PENDING");
  await upsertShop(arjun.id, {
    name: "Arjun Daily Needs",
    address: "5th Block, Koramangala, Bengaluru",
    latitude: 12.9352,
    longitude: 77.6245,
  });

  await upsertUser("asha@hyperlocal.test", "Asha Nair", "CUSTOMER", "APPROVED");
  await upsertUser("dev@hyperlocal.test", "Dev Patel", "CUSTOMER", "APPROVED");

  console.log(`
Seed complete. Every account uses the password: ${PASSWORD}

  admin@hyperlocal.test    admin
  ravi@hyperlocal.test     vendor, approved  - Ravi Kirana Store (MG Road)
  meena@hyperlocal.test    vendor, approved  - Meena Fresh Mart (Indiranagar)
  arjun@hyperlocal.test    vendor, PENDING   - hidden until an admin approves
  asha@hyperlocal.test     customer
  dev@hyperlocal.test      customer

Try: GET /api/shops/nearby?lat=12.9716&lng=77.5946&radiusKm=10
`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
