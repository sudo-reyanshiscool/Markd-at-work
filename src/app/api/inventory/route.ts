import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { success, error, validate } from "@/lib/api-utils";
import { requireAuth, requireRole } from "@/lib/auth-guard";
import { inventoryItemSchema } from "@/lib/validations";

// GET /api/inventory — list all items (with optional search & category filter)
export async function GET(req: NextRequest) {
  const { error: authErr } = await requireAuth();
  if (authErr) return authErr;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search");
  const category = searchParams.get("category");
  const lowStock = searchParams.get("lowStock");

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { sku: { contains: search, mode: "insensitive" } },
    ];
  }
  if (category) where.category = category;
  if (lowStock === "true") {
    where.quantity = { lte: prisma.inventoryItem.fields.minStock };
  }

  const items = await prisma.inventoryItem.findMany({
    where,
    orderBy: { updatedAt: "desc" },
  });

  return success(items);
}

// POST /api/inventory — create new item (ADMIN/MANAGER only)
export async function POST(req: NextRequest) {
  const { error: authErr } = await requireRole("ADMIN", "MANAGER");
  if (authErr) return authErr;

  try {
    const body = await req.json();
    const result = validate(inventoryItemSchema, body);
    if (result.error) return result.error;

    const item = await prisma.inventoryItem.create({ data: result.data });
    return success(item, 201);
  } catch (e: unknown) {
    if (typeof e === "object" && e !== null && "code" in e && (e as { code: string }).code === "P2002") {
      return error("SKU already exists", 409);
    }
    return error("Failed to create item", 500);
  }
}
