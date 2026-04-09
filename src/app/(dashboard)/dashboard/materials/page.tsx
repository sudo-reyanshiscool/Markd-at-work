"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api-client";
import { useToast } from "@/components/toast";

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
  const { toast } = useToast();
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    const params = search ? `?search=${encodeURIComponent(search)}` : "";
    api.get<RawMaterial[]>(`/api/materials${params}`)
      .then(setMaterials)
      .catch(() => toast("Failed to load materials", "error"))
      .finally(() => setLoading(false));
  }, [search, toast]);

  useEffect(() => { load(); }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data = { ...form, quantity: Number(form.quantity), minStock: Number(form.minStock), costPerUnit: Number(form.costPerUnit) };
      if (editId) {
        await api.patch(`/api/materials/${editId}`, data);
        toast("Material updated", "success");
      } else {
        await api.post("/api/materials", data);
        toast("Material created", "success");
      }
      setForm(emptyForm);
      setEditId(null);
      setShowForm(false);
      load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to save material", "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this material?")) return;
    try {
      await api.delete(`/api/materials/${id}`);
      toast("Material deleted", "success");
      load();
    } catch {
      toast("Failed to delete material", "error");
    }
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
        <form onSubmit={handleSubmit} className="bg-white border rounded-xl p-6 mb-6">
          <h2 className="font-semibold mb-4">{editId ? "Edit Material" : "New Raw Material"}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Name *</label>
              <input placeholder="e.g. Cotton Fabric - White" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border rounded-lg px-3 py-2 text-sm w-full" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">SKU *</label>
              <input placeholder="e.g. RM-COT-WHT" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="border rounded-lg px-3 py-2 text-sm w-full" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Category *</label>
              <input placeholder="e.g. Fabric" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="border rounded-lg px-3 py-2 text-sm w-full" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Quantity</label>
              <input type="number" min="0" step="0.01" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} className="border rounded-lg px-3 py-2 text-sm w-full" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Unit</label>
              <input placeholder="meters" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="border rounded-lg px-3 py-2 text-sm w-full" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Min Stock Alert</label>
              <input type="number" min="0" step="0.01" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: Number(e.target.value) })} className="border rounded-lg px-3 py-2 text-sm w-full" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Cost per Unit (Rs.)</label>
              <input type="number" min="0" step="0.01" value={form.costPerUnit} onChange={(e) => setForm({ ...form, costPerUnit: Number(e.target.value) })} className="border rounded-lg px-3 py-2 text-sm w-full" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Supplier</label>
              <input placeholder="Supplier name" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} className="border rounded-lg px-3 py-2 text-sm w-full" />
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
                <th className="text-right px-4 py-3 font-medium">Cost/Unit</th>
                <th className="text-left px-4 py-3 font-medium">Supplier</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {materials.map((mat) => (
                <tr key={mat.id} className={mat.quantity <= mat.minStock ? "bg-red-50" : ""}>
                  <td className="px-4 py-3 font-medium">{mat.name}</td>
                  <td className="px-4 py-3 text-gray-500">{mat.sku}</td>
                  <td className="px-4 py-3">{mat.category}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-medium ${mat.quantity <= mat.minStock ? "text-red-600" : ""}`}>{mat.quantity}</span>
                    <span className="text-gray-400 ml-1">{mat.unit}</span>
                  </td>
                  <td className="px-4 py-3 text-right">Rs. {mat.costPerUnit}</td>
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
