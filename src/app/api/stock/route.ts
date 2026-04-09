import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { success, error, validate } from "@/lib/api-utils";
import { requireAuth, requireRole } from "@/lib/auth-guard";
import { stockMovementSchema } from "@/lib/validations";

// GET /api/stock — list stock movement logs
export async function GET(req: NextRequest) {
  const { error: authErr } = await requireAuth();
  if (authErr) return authErr;

  const { searchParams } = new URL(req.url);
  const itemType = searchParams.get("itemType");
  const movementType = searchParams.get("movementType");
  const limit = parseInt(searchParams.get("limit") ?? "50");

  const where: Record<string, unknown> = {};
  if (itemType) where.itemType = itemType;
  if (movementType) where.movementType = movementType;

  const movements = await prisma.stockMovement.findMany({
    where,
    include: {
      inventoryItem: { select: { name: true, sku: true } },
      rawMaterial: { select: { name: true, sku: true } },
      createdBy: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: Math.min(limit, 200),
  });

  return success(movements);
}

// POST /api/stock — record a stock movement and update quantities
export async function POST(req: NextRequest) {
  const { session, error: authErr } = await requireRole("ADMIN", "MANAGER", "WORKER");
  if (authErr) return authErr;

  try {
    const body = await req.json();
    const result = validate(stockMovementSchema, body);
    if (result.error) return result.error;

    const { itemType, inventoryItemId, rawMaterialId, movementType, quantity, reason, reference } = result.data;

    // Validate that the correct ID is provided
    if (itemType === "INVENTORY" && !inventoryItemId) {
      return error("inventoryItemId is required for INVENTORY type", 422);
    }
    if (itemType === "RAW_MATERIAL" && !rawMaterialId) {
      return error("rawMaterialId is required for RAW_MATERIAL type", 422);
    }

    const userId = (session!.user as { id: string }).id;

    // Use a transaction to ensure atomicity
    const movement = await prisma.$transaction(async (tx) => {
      // Calculate quantity change
      const delta = movementType === "OUTFLOW" ? -quantity : quantity;

      // Update the item's quantity
      if (itemType === "INVENTORY" && inventoryItemId) {
        const item = await tx.inventoryItem.findUnique({ where: { id: inventoryItemId } });
        if (!item) throw new Error("Inventory item not found");
        if (item.quantity + delta < 0) throw new Error("Insufficient stock");
        await tx.inventoryItem.update({
          where: { id: inventoryItemId },
          data: { quantity: { increment: delta } },
        });
      } else if (itemType === "RAW_MATERIAL" && rawMaterialId) {
        const material = await tx.rawMaterial.findUnique({ where: { id: rawMaterialId } });
        if (!material) throw new Error("Raw material not found");
        if (material.quantity + delta < 0) throw new Error("Insufficient stock");
        await tx.rawMaterial.update({
          where: { id: rawMaterialId },
          data: { quantity: { increment: delta } },
        });
      }

      // Create the movement log
      return tx.stockMovement.create({
        data: {
          itemType,
          inventoryItemId: itemType === "INVENTORY" ? inventoryItemId : null,
          rawMaterialId: itemType === "RAW_MATERIAL" ? rawMaterialId : null,
          movementType,
          quantity,
          reason,
          reference,
          createdById: userId,
        },
        include: {
          inventoryItem: { select: { name: true, sku: true, quantity: true } },
          rawMaterial: { select: { name: true, sku: true, quantity: true } },
          createdBy: { select: { name: true } },
        },
      });
    });

    return success(movement, 201);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to record stock movement";
    return error(message, 400);
  }
}
