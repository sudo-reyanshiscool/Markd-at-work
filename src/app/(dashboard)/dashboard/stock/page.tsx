"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api-client";
import { useToast } from "@/components/toast";
import { PageHeader, Card, Button, Input, Select, Badge, EmptyState } from "@/components/ui";

interface StockMovement {
  id: string; itemType: string; movementType: string; quantity: number; reason: string | null;
  reference: string | null; createdAt: string; inventoryItem: { name: string; sku: string } | null;
  rawMaterial: { name: string; sku: string } | null; createdBy: { name: string };
}

interface InventoryItem { id: string; name: string; sku: string }
interface RawMaterial { id: string; name: string; sku: string }

const emptyForm = { itemType: "INVENTORY" as string, inventoryItemId: "", rawMaterialId: "", movementType: "INFLOW", quantity: 0, reason: "", reference: "" };

const movementBadge: Record<string, "green" | "red" | "blue"> = { INFLOW: "green", OUTFLOW: "red", ADJUSTMENT: "blue" };

export default function StockPage() {
  const { toast } = useToast();
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [filterType, setFilterType] = useState("");
  const [filterMovement, setFilterMovement] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterType) params.set("itemType", filterType);
    if (filterMovement) params.set("movementType", filterMovement);
    const qs = params.toString() ? `?${params}` : "";
    api.get<StockMovement[]>(`/api/stock${qs}`).then(setMovements).catch(() => toast("Failed to load movements", "error")).finally(() => setLoading(false));
  }, [filterType, filterMovement, toast]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    api.get<InventoryItem[]>("/api/inventory").then(setInventoryItems).catch(() => {});
    api.get<RawMaterial[]>("/api/materials").then(setRawMaterials).catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSubmitting(true);
    try {
      await api.post("/api/stock", {
        itemType: form.itemType, movementType: form.movementType, quantity: Number(form.quantity),
        inventoryItemId: form.itemType === "INVENTORY" ? form.inventoryItemId : undefined,
        rawMaterialId: form.itemType === "RAW_MATERIAL" ? form.rawMaterialId : undefined,
        reason: form.reason || undefined, reference: form.reference || undefined,
      });
      toast("Movement recorded", "success"); setForm(emptyForm); setShowForm(false); load();
    } catch (err) { toast(err instanceof Error ? err.message : "Failed to record movement", "error"); }
    finally { setSubmitting(false); }
  }

  return (
    <div>
      <PageHeader title="Stock Movements" description="Track all inflow, outflow, and adjustments"
        action={<Button onClick={() => setShowForm(!showForm)}>{showForm ? "Cancel" : "+ Record Movement"}</Button>}
      />

      {showForm && (
        <Card className="p-6 mb-6 animate-fade-in">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">Record Stock Movement</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select label="Item Type" value={form.itemType} onChange={(e) => setForm({ ...form, itemType: e.target.value, inventoryItemId: "", rawMaterialId: "" })}>
              <option value="INVENTORY">Inventory Item</option><option value="RAW_MATERIAL">Raw Material</option>
            </Select>
            {form.itemType === "INVENTORY" ? (
              <Select label="Select Item *" value={form.inventoryItemId} onChange={(e) => setForm({ ...form, inventoryItemId: e.target.value })} required>
                <option value="">Select item...</option>
                {inventoryItems.map((i) => <option key={i.id} value={i.id}>{i.name} ({i.sku})</option>)}
              </Select>
            ) : (
              <Select label="Select Material *" value={form.rawMaterialId} onChange={(e) => setForm({ ...form, rawMaterialId: e.target.value })} required>
                <option value="">Select material...</option>
                {rawMaterials.map((m) => <option key={m.id} value={m.id}>{m.name} ({m.sku})</option>)}
              </Select>
            )}
            <Select label="Direction" value={form.movementType} onChange={(e) => setForm({ ...form, movementType: e.target.value })}>
              <option value="INFLOW">Inflow (adding stock)</option><option value="OUTFLOW">Outflow (removing stock)</option><option value="ADJUSTMENT">Adjustment</option>
            </Select>
            <Input label="Quantity *" type="number" step="0.01" min={0.01} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} required />
            <Input label="Reason" placeholder="e.g. New shipment arrived" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
            <Input label="Reference" placeholder="e.g. PO-2024-001" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
            <div className="md:col-span-3 flex justify-end"><Button type="submit" disabled={submitting}>{submitting ? "Recording..." : "Record Movement"}</Button></div>
          </form>
        </Card>
      )}

      <div className="flex gap-3 mb-5">
        <Select value={filterType} onChange={(e) => setFilterType(e.target.value)}><option value="">All Types</option><option value="INVENTORY">Inventory</option><option value="RAW_MATERIAL">Raw Material</option></Select>
        <Select value={filterMovement} onChange={(e) => setFilterMovement(e.target.value)}><option value="">All Directions</option><option value="INFLOW">Inflow</option><option value="OUTFLOW">Outflow</option><option value="ADJUSTMENT">Adjustment</option></Select>
      </div>

      <Card>
        {loading ? (
          <div className="p-8 space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="h-10 bg-slate-100 rounded-lg animate-pulse" />)}</div>
        ) : movements.length === 0 ? (<EmptyState message="No movements recorded" />) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[800px]">
              <thead><tr className="border-b border-slate-100">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Item</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Direction</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Qty</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Reason</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">By</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-50">
                {movements.map((m) => (
                  <tr key={m.id}>
                    <td className="px-5 py-3.5 text-slate-500 text-xs whitespace-nowrap">{new Date(m.createdAt).toLocaleDateString()} {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</td>
                    <td className="px-5 py-3.5 font-medium text-slate-900">{m.inventoryItem?.name ?? m.rawMaterial?.name ?? "—"}</td>
                    <td className="px-5 py-3.5"><Badge color="gray">{m.itemType === "RAW_MATERIAL" ? "Material" : "Inventory"}</Badge></td>
                    <td className="px-5 py-3.5"><Badge color={movementBadge[m.movementType] ?? "gray"}>{m.movementType}</Badge></td>
                    <td className="px-5 py-3.5 text-right font-semibold text-slate-900">{m.quantity}</td>
                    <td className="px-5 py-3.5 text-slate-500 text-xs">{m.reason ?? <span className="text-slate-300">—</span>}</td>
                    <td className="px-5 py-3.5 text-slate-600">{m.createdBy.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
