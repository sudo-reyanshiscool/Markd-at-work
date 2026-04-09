import { prisma } from "@/lib/prisma";
import { success } from "@/lib/api-utils";
import { requireRole } from "@/lib/auth-guard";

// GET /api/users — list all users (ADMIN only)
export async function GET() {
  const { error: authErr } = await requireRole("ADMIN");
  if (authErr) return authErr;

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      _count: { select: { orders: true, stockMovements: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return success(users);
}
