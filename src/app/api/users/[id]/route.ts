import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { success, error, validate } from "@/lib/api-utils";
import { requireRole } from "@/lib/auth-guard";

type Params = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.enum(["ADMIN", "MANAGER", "WORKER"]).optional(),
});

// PATCH /api/users/:id — update user role/name (ADMIN only)
export async function PATCH(req: NextRequest, { params }: Params) {
  const { session, error: authErr } = await requireRole("ADMIN");
  if (authErr) return authErr;

  const { id } = await params;
  const body = await req.json();
  const result = validate(updateSchema, body);
  if (result.error) return result.error;

  // Prevent admin from demoting themselves
  const currentUserId = (session!.user as { id: string }).id;
  if (id === currentUserId && result.data.role && result.data.role !== "ADMIN") {
    return error("Cannot change your own role", 400);
  }

  try {
    const user = await prisma.user.update({
      where: { id },
      data: result.data,
      select: { id: true, name: true, email: true, role: true },
    });
    return success(user);
  } catch {
    return error("User not found", 404);
  }
}

// DELETE /api/users/:id — delete user (ADMIN only)
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { session, error: authErr } = await requireRole("ADMIN");
  if (authErr) return authErr;

  const { id } = await params;

  // Prevent self-deletion
  const currentUserId = (session!.user as { id: string }).id;
  if (id === currentUserId) {
    return error("Cannot delete your own account", 400);
  }

  try {
    await prisma.user.delete({ where: { id } });
    return success({ deleted: true });
  } catch {
    return error("User not found", 404);
  }
}
