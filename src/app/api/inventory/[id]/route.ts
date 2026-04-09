import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { success, error, validate } from "@/lib/api-utils";
import { requireAuth, requireRole } from "@/lib/auth-guard";
import { inventoryUpdateSchema } from "@/lib/validations";

type Params = { params: Promise<{ id: string }> };

// GET /api/inventory/:id
export async function GET(_req: NextRequest, { params }: Params) {
  const { error: authErr } = await requireAuth();
  if (authErr) return authErr;

  const { id } = await params;
  const item = await prisma.inventoryItem.findUnique({
    where: { id },
    include: { stockMovements: { orderBy: { createdAt: "desc" }, take: 20 } },
  });
  if (!item) return error("Item not found", 404);
  return success(item);
}

// PATCH /api/inventory/:id
export async function PATCH(req: NextRequest, { params }: Params) {
  const { error: authErr } = await requireRole("ADMIN", "MANAGER");
  if (authErr) return authErr;

  const { id } = await params;
  const body = await req.json();
  const result = validate(inventoryUpdateSchema, body);
  if (result.error) return result.error;

  try {
    const item = await prisma.inventoryItem.update({ where: { id }, data: result.data });
    return success(item);
  } catch {
    return error("Item not found", 404);
  }
}

// DELETE /api/inventory/:id
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { error: authErr } = await requireRole("ADMIN");
  if (authErr) return authErr;

  const { id } = await params;
  try {
    await prisma.inventoryItem.delete({ where: { id } });
    return success({ deleted: true });
  } catch {
    return error("Item not found", 404);
  }
}
