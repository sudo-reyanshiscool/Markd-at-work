import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { success, error, validate } from "@/lib/api-utils";
import { requireAuth, requireRole } from "@/lib/auth-guard";
import { rawMaterialSchema } from "@/lib/validations";

// GET /api/materials
export async function GET(req: NextRequest) {
  const { error: authErr } = await requireAuth();
  if (authErr) return authErr;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search");
  const category = searchParams.get("category");

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { sku: { contains: search, mode: "insensitive" } },
    ];
  }
  if (category) where.category = category;

  const materials = await prisma.rawMaterial.findMany({
    where,
    orderBy: { updatedAt: "desc" },
  });

  return success(materials);
}

// POST /api/materials
export async function POST(req: NextRequest) {
  const { error: authErr } = await requireRole("ADMIN", "MANAGER");
  if (authErr) return authErr;

  try {
    const body = await req.json();
    const result = validate(rawMaterialSchema, body);
    if (result.error) return result.error;

    const material = await prisma.rawMaterial.create({ data: result.data });
    return success(material, 201);
  } catch (e: unknown) {
    if (typeof e === "object" && e !== null && "code" in e && (e as { code: string }).code === "P2002") {
      return error("SKU already exists", 409);
    }
    return error("Failed to create material", 500);
  }
}
