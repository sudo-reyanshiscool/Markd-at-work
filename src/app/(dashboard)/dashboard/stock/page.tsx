"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api-client";
import { useToast } from "@/components/toast";

interface StockMovement {
  id: string;
  itemType: string;
  movementType: string;
  quantity: number;
  reason: string | null;
  reference: string | null;
  createdAt: string;
  inventoryItem: { name: string; sku: string } | null;
  rawMaterial: { name: string; sku: string } | null;
  createdBy: { name: string };
}

interface InventoryItem { id: string; name: string; sku: string }
interface RawMaterial { id: string; name: string; sku: string }

const emptyForm = { itemType: "INVENTORY" as string, inventoryItemId: "", rawMaterialId: "", movementType: "INFLOW", quantity: 0, reason: "", reference: "" };

const movementColors: Record<string, string> = {
  INFLOW: "text-green-600",
  OUTFLOW: "text-red-600",
  ADJUSTMENT: "text-blue-600",
};

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
    api.get<StockMovement[]>(`/api/stock${qs}`)
      .then(setMovements)
      .catch(() => toast("Failed to load stock movements", "error"))
      .finally(() => setLoading(false));
  }, [filterType, filterMovement, toast]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    api.get<InventoryItem[]>("/api/inventory").then(setInventoryItems).catch(() => {});
    api.get<RawMaterial[]>("/api/materials").then(setRawMaterials).catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data = {
        itemType: form.itemType,
        inventoryItemId: form.itemType === "INVENTORY" ? form.inventoryItemId : undefined,
        rawMaterialId: form.itemType === "RAW_MATERIAL" ? form.rawMaterialId : undefined,
        movementType: form.movementType,
        quantity: Number(form.quantity),
        reason: form.reason || undefined,
        reference: form.reference || undefined,
      };
      await api.post("/api/stock", data);
      toast("Stock movement recorded", "success");
      setForm(emptyForm);
      setShowForm(false);
      load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to record movement", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Stock Movements</h1>
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
          {showForm ? "Cancel" : "+ Record Movement"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border rounded-xl p-6 mb-6">
          <h2 className="font-semibold mb-4">Record Stock Movement</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Item Type</label>
              <select value={form.itemType} onChange={(e) => setForm({ ...form, itemType: e.target.value, inventoryItemId: "", rawMaterialId: "" })} className="border rounded-lg px-3 py-2 text-sm w-full">
                <option value="INVENTORY">Inventory Item</option>
                <option value="RAW_MATERIAL">Raw Material</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Select Item *</label>
              {form.itemType === "INVENTORY" ? (
                <select value={form.inventoryItemId} onChange={(e) => setForm({ ...form, inventoryItemId: e.target.value })} className="border rounded-lg px-3 py-2 text-sm w-full" required>
                  <option value="">Select item...</option>
                  {inventoryItems.map((i) => <option key={i.id} value={i.id}>{i.name} ({i.sku})</option>)}
                </select>
              ) : (
                <select value={form.rawMaterialId} onChange={(e) => setForm({ ...form, rawMaterialId: e.target.value })} className="border rounded-lg px-3 py-2 text-sm w-full" required>
                  <option value="">Select material...</option>
                  {rawMaterials.map((m) => <option key={m.id} value={m.id}>{m.name} ({m.sku})</option>)}
                </select>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Direction</label>
              <select value={form.movementType} onChange={(e) => setForm({ ...form, movementType: e.target.value })} className="border rounded-lg px-3 py-2 text-sm w-full">
                <option value="INFLOW">Inflow (adding stock)</option>
                <option value="OUTFLOW">Outflow (removing stock)</option>
                <option value="ADJUSTMENT">Adjustment (correction)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Quantity *</label>
              <input type="number" step="0.01" min="0.01" placeholder="Amount" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} className="border rounded-lg px-3 py-2 text-sm w-full" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Reason</label>
              <input placeholder="e.g. New shipment arrived" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className="border rounded-lg px-3 py-2 text-sm w-full" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Reference</label>
              <input placeholder="e.g. PO-2024-001" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} className="border rounded-lg px-3 py-2 text-sm w-full" />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button type="submit" disabled={submitting} className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {submitting ? "Recording..." : "Record Movement"}
            </button>
          </div>
        </form>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
          <option value="">All Types</option>
          <option value="INVENTORY">Inventory</option>
          <option value="RAW_MATERIAL">Raw Material</option>
        </select>
        <select value={filterMovement} onChange={(e) => setFilterMovement(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
          <option value="">All Directions</option>
          <option value="INFLOW">Inflow</option>
          <option value="OUTFLOW">Outflow</option>
          <option value="ADJUSTMENT">Adjustment</option>
        </select>
      </div>

      {loading ? (
        <div className="bg-white border rounded-xl overflow-hidden">
          {[1,2,3,4,5].map((i) => <div key={i} className="h-12 border-b animate-pulse" />)}
        </div>
      ) : (
        <div className="bg-white border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Date</th>
                <th className="text-left px-4 py-3 font-medium">Item</th>
                <th className="text-left px-4 py-3 font-medium">Type</th>
                <th className="text-left px-4 py-3 font-medium">Direction</th>
                <th className="text-right px-4 py-3 font-medium">Qty</th>
                <th className="text-left px-4 py-3 font-medium">Reason</th>
                <th className="text-left px-4 py-3 font-medium">Ref</th>
                <th className="text-left px-4 py-3 font-medium">By</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {movements.map((m) => (
                <tr key={m.id}>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{new Date(m.createdAt).toLocaleDateString()} {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</td>
                  <td className="px-4 py-3 font-medium">{m.inventoryItem?.name ?? m.rawMaterial?.name ?? "—"}</td>
                  <td className="px-4 py-3"><span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{m.itemType === "RAW_MATERIAL" ? "Material" : "Inventory"}</span></td>
                  <td className={`px-4 py-3 font-medium ${movementColors[m.movementType]}`}>{m.movementType}</td>
                  <td className="px-4 py-3 text-right font-medium">{m.quantity}</td>
                  <td className="px-4 py-3 text-gray-500">{m.reason ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-400">{m.reference ?? "—"}</td>
                  <td className="px-4 py-3">{m.createdBy.name}</td>
                </tr>
              ))}
              {movements.length === 0 && <tr><td colSpan={8} className="text-center py-8 text-gray-400">No movements recorded</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
