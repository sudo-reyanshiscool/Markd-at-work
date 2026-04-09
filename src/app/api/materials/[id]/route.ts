import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { success, error, validate } from "@/lib/api-utils";
import { requireAuth, requireRole } from "@/lib/auth-guard";
import { rawMaterialUpdateSchema } from "@/lib/validations";

type Params = { params: Promise<{ id: string }> };

// GET /api/materials/:id
export async function GET(_req: NextRequest, { params }: Params) {
  const { error: authErr } = await requireAuth();
  if (authErr) return authErr;

  const { id } = await params;
  const material = await prisma.rawMaterial.findUnique({
    where: { id },
    include: { stockMovements: { orderBy: { createdAt: "desc" }, take: 20 } },
  });
  if (!material) return error("Material not found", 404);
  return success(material);
}

// PATCH /api/materials/:id
export async function PATCH(req: NextRequest, { params }: Params) {
  const { error: authErr } = await requireRole("ADMIN", "MANAGER");
  if (authErr) return authErr;

  const { id } = await params;
  const body = await req.json();
  const result = validate(rawMaterialUpdateSchema, body);
  if (result.error) return result.error;

  try {
    const material = await prisma.rawMaterial.update({ where: { id }, data: result.data });
    return success(material);
  } catch {
    return error("Material not found", 404);
  }
}

// DELETE /api/materials/:id
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { error: authErr } = await requireRole("ADMIN");
  if (authErr) return authErr;

  const { id } = await params;
  try {
    await prisma.rawMaterial.delete({ where: { id } });
    return success({ deleted: true });
  } catch {
    return error("Material not found", 404);
  }
}
