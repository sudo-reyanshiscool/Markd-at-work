import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { success, error, validate } from "@/lib/api-utils";

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["ADMIN", "MANAGER", "WORKER"]).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = validate(registerSchema, body);
    if (result.error) return result.error;

    const existing = await prisma.user.findUnique({ where: { email: result.data.email } });
    if (existing) return error("Email already registered", 409);

    const hashedPassword = await bcrypt.hash(result.data.password, 12);
    const user = await prisma.user.create({
      data: {
        name: result.data.name,
        email: result.data.email,
        hashedPassword,
        role: result.data.role ?? "WORKER",
      },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    return success(user, 201);
  } catch {
    return error("Registration failed", 500);
  }
}
