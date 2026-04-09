import { z } from "zod";

export const inventoryItemSchema = z.object({
  name: z.string().min(1),
  sku: z.string().min(1),
  category: z.string().min(1),
  quantity: z.number().int().min(0).optional(),
  unit: z.string().optional(),
  minStock: z.number().int().min(0).optional(),
  description: z.string().optional(),
});

export const inventoryUpdateSchema = inventoryItemSchema.partial();

export const rawMaterialSchema = z.object({
  name: z.string().min(1),
  sku: z.string().min(1),
  category: z.string().min(1),
  quantity: z.number().min(0).optional(),
  unit: z.string().optional(),
  minStock: z.number().min(0).optional(),
  costPerUnit: z.number().min(0).optional(),
  supplier: z.string().optional(),
  description: z.string().optional(),
});

export const rawMaterialUpdateSchema = rawMaterialSchema.partial();

export const orderItemSchema = z.object({
  inventoryItemId: z.string().min(1),
  quantity: z.number().int().min(1),
  unitPrice: z.number().min(0).optional(),
  notes: z.string().optional(),
});

export const orderCreateSchema = z.object({
  customerName: z.string().min(1),
  customerPhone: z.string().optional(),
  notes: z.string().optional(),
  deadline: z.string().datetime().optional(),
  items: z.array(orderItemSchema).min(1),
});

export const orderUpdateSchema = z.object({
  customerName: z.string().min(1).optional(),
  customerPhone: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["PENDING", "CONFIRMED", "PROCESSING", "COMPLETED", "CANCELLED"]).optional(),
  deadline: z.string().datetime().optional(),
});

export const stockMovementSchema = z.object({
  itemType: z.enum(["INVENTORY", "RAW_MATERIAL"]),
  inventoryItemId: z.string().optional(),
  rawMaterialId: z.string().optional(),
  movementType: z.enum(["INFLOW", "OUTFLOW", "ADJUSTMENT"]),
  quantity: z.number().positive(),
  reason: z.string().optional(),
  reference: z.string().optional(),
});
