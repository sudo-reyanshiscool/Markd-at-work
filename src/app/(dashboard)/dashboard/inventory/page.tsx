"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api-client";
import { useToast } from "@/components/toast";

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  unit: string;
  minStock: number;
  description: string | null;
}

const emptyForm = { name: "", sku: "", category: "", quantity: 0, unit: "pcs", minStock: 0, description: "" };

export default function InventoryPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    const params = search ? `?search=${encodeURIComponent(search)}` : "";
    api.get<InventoryItem[]>(`/api/inventory${params}`)
      .then(setItems)
      .catch(() => toast("Failed to load inventory", "error"))
      .finally(() => setLoading(false));
  }, [search, toast]);

  useEffect(() => { load(); }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data = { ...form, quantity: Number(form.quantity), minStock: Number(form.minStock) };
      if (editId) {
        await api.patch(`/api/inventory/${editId}`, data);
        toast("Item updated", "success");
      } else {
        await api.post("/api/inventory", data);
        toast("Item created", "success");
      }
      setForm(emptyForm);
      setEditId(null);
      setShowForm(false);
      load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to save item", "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this item?")) return;
    try {
      await api.delete(`/api/inventory/${id}`);
      toast("Item deleted", "success");
      load();
    } catch {
      toast("Failed to delete item", "error");
    }
  }

  function handleEdit(item: InventoryItem) {
    setForm({ name: item.name, sku: item.sku, category: item.category, quantity: item.quantity, unit: item.unit, minStock: item.minStock, description: item.description ?? "" });
    setEditId(item.id);
    setShowForm(true);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Inventory</h1>
        <button onClick={() => { setShowForm(!showForm); setEditId(null); setForm(emptyForm); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
          {showForm ? "Cancel" : "+ Add Item"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border rounded-xl p-6 mb-6">
          <h2 className="font-semibold mb-4">{editId ? "Edit Item" : "New Inventory Item"}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Name *</label>
              <input placeholder="e.g. Men's Kurta - White" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border rounded-lg px-3 py-2 text-sm w-full" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">SKU *</label>
              <input placeholder="e.g. MK-WHT-001" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="border rounded-lg px-3 py-2 text-sm w-full" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Category *</label>
              <input placeholder="e.g. Kurta" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="border rounded-lg px-3 py-2 text-sm w-full" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Quantity</label>
              <input type="number" min="0" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} className="border rounded-lg px-3 py-2 text-sm w-full" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Unit</label>
              <input placeholder="pcs" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="border rounded-lg px-3 py-2 text-sm w-full" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Min Stock Alert</label>
              <input type="number" min="0" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: Number(e.target.value) })} className="border rounded-lg px-3 py-2 text-sm w-full" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
              <input placeholder="Optional description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="border rounded-lg px-3 py-2 text-sm w-full" />
            </div>
            <div className="flex items-end">
              <button type="submit" disabled={submitting} className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 w-full">
                {submitting ? "Saving..." : editId ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="mb-4">
        <input placeholder="Search by name or SKU..." value={search} onChange={(e) => setSearch(e.target.value)} className="border rounded-lg px-3 py-2 text-sm w-full max-w-md" />
      </div>

      {loading ? (
        <div className="bg-white border rounded-xl overflow-hidden">
          {[1,2,3,4].map((i) => <div key={i} className="h-12 border-b animate-pulse" />)}
        </div>
      ) : (
        <div className="bg-white border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Name</th>
                <th className="text-left px-4 py-3 font-medium">SKU</th>
                <th className="text-left px-4 py-3 font-medium">Category</th>
                <th className="text-right px-4 py-3 font-medium">Qty</th>
                <th className="text-right px-4 py-3 font-medium">Min Stock</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((item) => (
                <tr key={item.id} className={item.quantity <= item.minStock ? "bg-red-50" : ""}>
                  <td className="px-4 py-3 font-medium">{item.name}</td>
                  <td className="px-4 py-3 text-gray-500">{item.sku}</td>
                  <td className="px-4 py-3">{item.category}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-medium ${item.quantity <= item.minStock ? "text-red-600" : ""}`}>{item.quantity}</span>
                    <span className="text-gray-400 ml-1">{item.unit}</span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500">{item.minStock}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => handleEdit(item)} className="text-blue-600 hover:underline">Edit</button>
                    <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-gray-400">No items found</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
