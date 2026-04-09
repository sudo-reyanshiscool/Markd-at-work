"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api-client";

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
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    const params = search ? `?search=${encodeURIComponent(search)}` : "";
    api.get<InventoryItem[]>(`/api/inventory${params}`).then(setItems).finally(() => setLoading(false));
  }, [search]);

  useEffect(() => { load(); }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data = { ...form, quantity: Number(form.quantity), minStock: Number(form.minStock) };
    if (editId) {
      await api.patch(`/api/inventory/${editId}`, data);
    } else {
      await api.post("/api/inventory", data);
    }
    setForm(emptyForm);
    setEditId(null);
    setShowForm(false);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this item?")) return;
    await api.delete(`/api/inventory/${id}`);
    load();
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
        <form onSubmit={handleSubmit} className="bg-white border rounded-xl p-6 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" required />
          <input placeholder="SKU" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" required />
          <input placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" required />
          <input type="number" placeholder="Quantity" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} className="border rounded-lg px-3 py-2 text-sm" />
          <input placeholder="Unit" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
          <input type="number" placeholder="Min Stock" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: Number(e.target.value) })} className="border rounded-lg px-3 py-2 text-sm" />
          <input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="border rounded-lg px-3 py-2 text-sm md:col-span-2" />
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
            {editId ? "Update" : "Create"}
          </button>
        </form>
      )}

      <div className="mb-4">
        <input placeholder="Search by name or SKU..." value={search} onChange={(e) => setSearch(e.target.value)} className="border rounded-lg px-3 py-2 text-sm w-full max-w-md" />
      </div>

      {loading ? (
        <div className="animate-pulse">Loading...</div>
      ) : (
        <div className="bg-white border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Name</th>
                <th className="text-left px-4 py-3 font-medium">SKU</th>
                <th className="text-left px-4 py-3 font-medium">Category</th>
                <th className="text-right px-4 py-3 font-medium">Qty</th>
                <th className="text-right px-4 py-3 font-medium">Min</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((item) => (
                <tr key={item.id} className={item.quantity <= item.minStock ? "bg-red-50" : ""}>
                  <td className="px-4 py-3">{item.name}</td>
                  <td className="px-4 py-3 text-gray-500">{item.sku}</td>
                  <td className="px-4 py-3">{item.category}</td>
                  <td className="px-4 py-3 text-right font-medium">{item.quantity} {item.unit}</td>
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
