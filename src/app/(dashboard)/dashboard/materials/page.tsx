"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api-client";

interface RawMaterial {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  unit: string;
  minStock: number;
  costPerUnit: number;
  supplier: string | null;
}

const emptyForm = { name: "", sku: "", category: "", quantity: 0, unit: "meters", minStock: 0, costPerUnit: 0, supplier: "" };

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    const params = search ? `?search=${encodeURIComponent(search)}` : "";
    api.get<RawMaterial[]>(`/api/materials${params}`).then(setMaterials).finally(() => setLoading(false));
  }, [search]);

  useEffect(() => { load(); }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data = { ...form, quantity: Number(form.quantity), minStock: Number(form.minStock), costPerUnit: Number(form.costPerUnit) };
    if (editId) {
      await api.patch(`/api/materials/${editId}`, data);
    } else {
      await api.post("/api/materials", data);
    }
    setForm(emptyForm);
    setEditId(null);
    setShowForm(false);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this material?")) return;
    await api.delete(`/api/materials/${id}`);
    load();
  }

  function handleEdit(mat: RawMaterial) {
    setForm({ name: mat.name, sku: mat.sku, category: mat.category, quantity: mat.quantity, unit: mat.unit, minStock: mat.minStock, costPerUnit: mat.costPerUnit, supplier: mat.supplier ?? "" });
    setEditId(mat.id);
    setShowForm(true);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Raw Materials</h1>
        <button onClick={() => { setShowForm(!showForm); setEditId(null); setForm(emptyForm); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
          {showForm ? "Cancel" : "+ Add Material"}
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
          <input type="number" step="0.01" placeholder="Cost/Unit" value={form.costPerUnit} onChange={(e) => setForm({ ...form, costPerUnit: Number(e.target.value) })} className="border rounded-lg px-3 py-2 text-sm" />
          <input placeholder="Supplier" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
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
                <th className="text-right px-4 py-3 font-medium">Cost/Unit</th>
                <th className="text-left px-4 py-3 font-medium">Supplier</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {materials.map((mat) => (
                <tr key={mat.id} className={mat.quantity <= mat.minStock ? "bg-red-50" : ""}>
                  <td className="px-4 py-3">{mat.name}</td>
                  <td className="px-4 py-3 text-gray-500">{mat.sku}</td>
                  <td className="px-4 py-3">{mat.category}</td>
                  <td className="px-4 py-3 text-right font-medium">{mat.quantity} {mat.unit}</td>
                  <td className="px-4 py-3 text-right">{mat.costPerUnit}</td>
                  <td className="px-4 py-3">{mat.supplier ?? "—"}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => handleEdit(mat)} className="text-blue-600 hover:underline">Edit</button>
                    <button onClick={() => handleDelete(mat.id)} className="text-red-600 hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
              {materials.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-gray-400">No materials found</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
