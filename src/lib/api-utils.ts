import { NextResponse } from "next/server";
import { ZodSchema, ZodError } from "zod";

export function success(data: unknown, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function error(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export function validate<T>(schema: ZodSchema<T>, data: unknown): { data: T; error?: never } | { data?: never; error: NextResponse } {
  try {
    return { data: schema.parse(data) };
  } catch (e) {
    if (e instanceof ZodError) {
      const issues = e.issues ?? [];
      const messages = issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`);
      return { error: error(messages.join(", "), 422) };
    }
    return { error: error("Validation failed", 422) };
  }
}

export function generateOrderNumber(): string {
  const date = new Date();
  const prefix = `ORD-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`;
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `${prefix}-${random}`;
}
