"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api-client";

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

const emptyForm = { itemType: "INVENTORY" as string, inventoryItemId: "", rawMaterialId: "", movementType: "INFLOW", quantity: 0, reason: "" };

const movementColors: Record<string, string> = {
  INFLOW: "text-green-600",
  OUTFLOW: "text-red-600",
  ADJUSTMENT: "text-blue-600",
};

export default function StockPage() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);

  const load = useCallback(() => {
    setLoading(true);
    api.get<StockMovement[]>("/api/stock").then(setMovements).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    api.get<InventoryItem[]>("/api/inventory").then(setInventoryItems);
    api.get<RawMaterial[]>("/api/materials").then(setRawMaterials);
  }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data = {
      itemType: form.itemType,
      inventoryItemId: form.itemType === "INVENTORY" ? form.inventoryItemId : undefined,
      rawMaterialId: form.itemType === "RAW_MATERIAL" ? form.rawMaterialId : undefined,
      movementType: form.movementType,
      quantity: Number(form.quantity),
      reason: form.reason || undefined,
    };
    await api.post("/api/stock", data);
    setForm(emptyForm);
    setShowForm(false);
    load();
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
        <form onSubmit={handleSubmit} className="bg-white border rounded-xl p-6 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <select value={form.itemType} onChange={(e) => setForm({ ...form, itemType: e.target.value })} className="border rounded-lg px-3 py-2 text-sm">
            <option value="INVENTORY">Inventory Item</option>
            <option value="RAW_MATERIAL">Raw Material</option>
          </select>

          {form.itemType === "INVENTORY" ? (
            <select value={form.inventoryItemId} onChange={(e) => setForm({ ...form, inventoryItemId: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" required>
              <option value="">Select item...</option>
              {inventoryItems.map((i) => <option key={i.id} value={i.id}>{i.name} ({i.sku})</option>)}
            </select>
          ) : (
            <select value={form.rawMaterialId} onChange={(e) => setForm({ ...form, rawMaterialId: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" required>
              <option value="">Select material...</option>
              {rawMaterials.map((m) => <option key={m.id} value={m.id}>{m.name} ({m.sku})</option>)}
            </select>
          )}

          <select value={form.movementType} onChange={(e) => setForm({ ...form, movementType: e.target.value })} className="border rounded-lg px-3 py-2 text-sm">
            <option value="INFLOW">Inflow</option>
            <option value="OUTFLOW">Outflow</option>
            <option value="ADJUSTMENT">Adjustment</option>
          </select>

          <input type="number" step="0.01" placeholder="Quantity" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} className="border rounded-lg px-3 py-2 text-sm" required />
          <input placeholder="Reason (optional)" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">Record</button>
        </form>
      )}

      {loading ? (
        <div className="animate-pulse">Loading...</div>
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
                <th className="text-left px-4 py-3 font-medium">By</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {movements.map((m) => (
                <tr key={m.id}>
                  <td className="px-4 py-3 text-gray-500">{new Date(m.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3">{m.inventoryItem?.name ?? m.rawMaterial?.name ?? "—"}</td>
                  <td className="px-4 py-3"><span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{m.itemType}</span></td>
                  <td className={`px-4 py-3 font-medium ${movementColors[m.movementType]}`}>{m.movementType}</td>
                  <td className="px-4 py-3 text-right font-medium">{m.quantity}</td>
                  <td className="px-4 py-3 text-gray-500">{m.reason ?? "—"}</td>
                  <td className="px-4 py-3">{m.createdBy.name}</td>
                </tr>
              ))}
              {movements.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-gray-400">No movements recorded</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
