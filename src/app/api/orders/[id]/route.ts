import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { success, error, validate } from "@/lib/api-utils";
import { requireAuth, requireRole } from "@/lib/auth-guard";
import { orderUpdateSchema } from "@/lib/validations";

type Params = { params: Promise<{ id: string }> };

// GET /api/orders/:id
export async function GET(_req: NextRequest, { params }: Params) {
  const { error: authErr } = await requireAuth();
  if (authErr) return authErr;

  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { inventoryItem: true } },
      createdBy: { select: { name: true, email: true } },
    },
  });
  if (!order) return error("Order not found", 404);
  return success(order);
}

// PATCH /api/orders/:id — update order details or status
export async function PATCH(req: NextRequest, { params }: Params) {
  const { error: authErr } = await requireRole("ADMIN", "MANAGER");
  if (authErr) return authErr;

  const { id } = await params;
  const body = await req.json();
  const result = validate(orderUpdateSchema, body);
  if (result.error) return result.error;

  try {
    const data: Record<string, unknown> = { ...result.data };
    if (result.data.deadline) data.deadline = new Date(result.data.deadline);

    const order = await prisma.order.update({
      where: { id },
      data,
      include: {
        items: { include: { inventoryItem: { select: { name: true, sku: true } } } },
      },
    });
    return success(order);
  } catch {
    return error("Order not found", 404);
  }
}

// DELETE /api/orders/:id
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { error: authErr } = await requireRole("ADMIN");
  if (authErr) return authErr;

  const { id } = await params;
  try {
    await prisma.order.delete({ where: { id } });
    return success({ deleted: true });
  } catch {
    return error("Order not found", 404);
  }
}
