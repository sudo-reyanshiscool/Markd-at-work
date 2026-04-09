import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { success, error, validate, generateOrderNumber } from "@/lib/api-utils";
import { requireAuth, requireRole } from "@/lib/auth-guard";
import { orderCreateSchema } from "@/lib/validations";

// GET /api/orders
export async function GET(req: NextRequest) {
  const { error: authErr } = await requireAuth();
  if (authErr) return authErr;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { customerName: { contains: search, mode: "insensitive" } },
      { orderNumber: { contains: search, mode: "insensitive" } },
    ];
  }

  const orders = await prisma.order.findMany({
    where,
    include: {
      items: { include: { inventoryItem: { select: { name: true, sku: true } } } },
      createdBy: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return success(orders);
}

// POST /api/orders
export async function POST(req: NextRequest) {
  const { session, error: authErr } = await requireRole("ADMIN", "MANAGER");
  if (authErr) return authErr;

  try {
    const body = await req.json();
    const result = validate(orderCreateSchema, body);
    if (result.error) return result.error;

    const userId = (session!.user as { id: string }).id;
    const totalAmount = result.data.items.reduce(
      (sum, item) => sum + item.quantity * (item.unitPrice ?? 0),
      0
    );

    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        customerName: result.data.customerName,
        customerPhone: result.data.customerPhone,
        notes: result.data.notes,
        deadline: result.data.deadline ? new Date(result.data.deadline) : null,
        totalAmount,
        createdById: userId,
        items: {
          create: result.data.items.map((item) => ({
            inventoryItemId: item.inventoryItemId,
            quantity: item.quantity,
            unitPrice: item.unitPrice ?? 0,
            notes: item.notes,
          })),
        },
      },
      include: {
        items: { include: { inventoryItem: { select: { name: true, sku: true } } } },
        createdBy: { select: { name: true } },
      },
    });

    return success(order, 201);
  } catch {
    return error("Failed to create order", 500);
  }
}
