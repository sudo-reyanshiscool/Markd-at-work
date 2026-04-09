import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { error } from "./api-utils";
import { Role } from "@prisma/client";

export async function getSession() {
  return getServerSession(authOptions);
}

export async function requireAuth() {
  const session = await getSession();
  if (!session?.user) {
    return { session: null, error: error("Unauthorized", 401) };
  }
  return { session, error: null };
}

export async function requireRole(...roles: Role[]) {
  const { session, error: authError } = await requireAuth();
  if (authError) return { session: null, error: authError };

  const userRole = (session!.user as { role: string }).role as Role;
  if (!roles.includes(userRole)) {
    return { session: null, error: error("Forbidden: insufficient permissions", 403) };
  }
  return { session: session!, error: null };
}
