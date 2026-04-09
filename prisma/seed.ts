import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create default admin user
  const hashedPassword = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@markdatwork.com" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@markdatwork.com",
      hashedPassword,
      role: "ADMIN",
    },
  });
  console.log(`Admin user: ${admin.email}`);

  // Create a manager
  const manager = await prisma.user.upsert({
    where: { email: "manager@markdatwork.com" },
    update: {},
    create: {
      name: "Factory Manager",
      email: "manager@markdatwork.com",
      hashedPassword: await bcrypt.hash("manager123", 12),
      role: "MANAGER",
    },
  });
  console.log(`Manager user: ${manager.email}`);

  // Seed inventory items
  const items = [
    { name: "Men's Kurta - White", sku: "MK-WHT-001", category: "Kurta", quantity: 50, unit: "pcs", minStock: 10 },
    { name: "Men's Kurta - Blue", sku: "MK-BLU-001", category: "Kurta", quantity: 30, unit: "pcs", minStock: 10 },
    { name: "Women's Saree - Silk", sku: "WS-SLK-001", category: "Saree", quantity: 25, unit: "pcs", minStock: 5 },
    { name: "Men's Trouser - Black", sku: "MT-BLK-001", category: "Trouser", quantity: 40, unit: "pcs", minStock: 15 },
    { name: "Women's Salwar Set", sku: "WSS-001", category: "Salwar", quantity: 20, unit: "pcs", minStock: 8 },
  ];

  for (const item of items) {
    await prisma.inventoryItem.upsert({
      where: { sku: item.sku },
      update: {},
      create: item,
    });
  }
  console.log(`Seeded ${items.length} inventory items`);

  // Seed raw materials
  const materials = [
    { name: "Cotton Fabric - White", sku: "RM-COT-WHT", category: "Fabric", quantity: 500, unit: "meters", minStock: 100, costPerUnit: 120 },
    { name: "Silk Fabric - Red", sku: "RM-SLK-RED", category: "Fabric", quantity: 200, unit: "meters", minStock: 50, costPerUnit: 450 },
    { name: "Thread - White", sku: "RM-THR-WHT", category: "Thread", quantity: 100, unit: "spools", minStock: 20, costPerUnit: 25 },
    { name: "Buttons - Pearl", sku: "RM-BTN-PRL", category: "Accessories", quantity: 1000, unit: "pcs", minStock: 200, costPerUnit: 5 },
    { name: "Zipper - Metal 6in", sku: "RM-ZIP-M6", category: "Accessories", quantity: 300, unit: "pcs", minStock: 50, costPerUnit: 15 },
  ];

  for (const mat of materials) {
    await prisma.rawMaterial.upsert({
      where: { sku: mat.sku },
      update: {},
      create: mat,
    });
  }
  console.log(`Seeded ${materials.length} raw materials`);

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
