import { prisma } from "@/lib/prisma";
import { success } from "@/lib/api-utils";
import { requireAuth } from "@/lib/auth-guard";

// GET /api/dashboard — aggregated stats
export async function GET() {
  const { error: authErr } = await requireAuth();
  if (authErr) return authErr;

  const [
    totalInventoryItems,
    totalRawMaterials,
    ordersByStatus,
    recentOrders,
    lowStockInventory,
    lowStockMaterials,
    recentMovements,
  ] = await Promise.all([
    prisma.inventoryItem.count(),
    prisma.rawMaterial.count(),
    prisma.order.groupBy({ by: ["status"], _count: { id: true } }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        status: true,
        totalAmount: true,
        createdAt: true,
      },
    }),
    prisma.$queryRaw`
      SELECT id, name, sku, quantity, "minStock"
      FROM inventory_items
      WHERE quantity <= "minStock"
      ORDER BY quantity ASC
      LIMIT 10
    `,
    prisma.$queryRaw`
      SELECT id, name, sku, quantity, "minStock"
      FROM raw_materials
      WHERE quantity <= "minStock"
      ORDER BY quantity ASC
      LIMIT 10
    `,
    prisma.stockMovement.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        inventoryItem: { select: { name: true } },
        rawMaterial: { select: { name: true } },
        createdBy: { select: { name: true } },
      },
    }),
  ]);

  const statusCounts = Object.fromEntries(
    ordersByStatus.map((s) => [s.status, s._count.id])
  );

  return success({
    counts: {
      inventoryItems: totalInventoryItems,
      rawMaterials: totalRawMaterials,
      orders: statusCounts,
    },
    recentOrders,
    lowStock: { inventory: lowStockInventory, materials: lowStockMaterials },
    recentMovements,
  });
}
