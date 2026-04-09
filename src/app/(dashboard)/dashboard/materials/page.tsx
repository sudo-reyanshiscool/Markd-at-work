"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api-client";
import { useToast } from "@/components/toast";
import { PageHeader, Card, Button, Input, EmptyState } from "@/components/ui";

interface RawMaterial {
  id: string; name: string; sku: string; category: string; quantity: number; unit: string; minStock: number; costPerUnit: number; supplier: string | null;
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
    e.preventDefault(); setSubmitting(true);
    try {
      const data = { ...form, quantity: Number(form.quantity), minStock: Number(form.minStock), costPerUnit: Number(form.costPerUnit) };
      if (editId) { await api.patch(`/api/materials/${editId}`, data); toast("Material updated", "success"); }
      else { await api.post("/api/materials", data); toast("Material created", "success"); }
      setForm(emptyForm); setEditId(null); setShowForm(false); load();
    } catch (err) { toast(err instanceof Error ? err.message : "Failed to save material", "error"); }
    finally { setSubmitting(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this material?")) return;
    try { await api.delete(`/api/materials/${id}`); toast("Material deleted", "success"); load(); }
    catch { toast("Failed to delete material", "error"); }
  }

  function handleEdit(mat: RawMaterial) {
    setForm({ name: mat.name, sku: mat.sku, category: mat.category, quantity: mat.quantity, unit: mat.unit, minStock: mat.minStock, costPerUnit: mat.costPerUnit, supplier: mat.supplier ?? "" });
    setEditId(mat.id); setShowForm(true);
  }

  return (
    <div>
      <PageHeader title="Raw Materials" description="Track fabric, threads, and accessories"
        action={<Button onClick={() => { setShowForm(!showForm); setEditId(null); setForm(emptyForm); }}>{showForm ? "Cancel" : "+ Add Material"}</Button>}
      />

      {showForm && (
        <Card className="p-6 mb-6 animate-fade-in">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">{editId ? "Edit Material" : "New Raw Material"}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input label="Name *" placeholder="e.g. Cotton Fabric - White" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <Input label="SKU *" placeholder="e.g. RM-COT-WHT" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} required />
            <Input label="Category *" placeholder="e.g. Fabric" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required />
            <Input label="Quantity" type="number" min={0} step="0.01" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} />
            <Input label="Unit" placeholder="meters" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
            <Input label="Min Stock Alert" type="number" min={0} step="0.01" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: Number(e.target.value) })} />
            <Input label="Cost per Unit (Rs.)" type="number" min={0} step="0.01" value={form.costPerUnit} onChange={(e) => setForm({ ...form, costPerUnit: Number(e.target.value) })} />
            <Input label="Supplier" placeholder="Supplier name" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
            <div className="flex items-end"><Button type="submit" disabled={submitting} className="w-full">{submitting ? "Saving..." : editId ? "Update" : "Create"}</Button></div>
          </form>
        </Card>
      )}

      <div className="mb-5"><Input placeholder="Search by name or SKU..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-md" /></div>

      <Card>
        {loading ? (
          <div className="p-8 space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-10 bg-slate-100 rounded-lg animate-pulse" />)}</div>
        ) : materials.length === 0 ? (<EmptyState message="No materials found" />) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[800px]">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">SKU</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                  <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Quantity</th>
                  <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Cost/Unit</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Supplier</th>
                  <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {materials.map((mat) => (
                  <tr key={mat.id} className={mat.quantity <= mat.minStock ? "bg-red-50/50" : ""}>
                    <td className="px-5 py-3.5 font-medium text-slate-900">{mat.name}</td>
                    <td className="px-5 py-3.5 text-slate-500 font-mono text-xs">{mat.sku}</td>
                    <td className="px-5 py-3.5"><span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md text-xs font-medium">{mat.category}</span></td>
                    <td className="px-5 py-3.5 text-right">
                      <span className={`font-semibold ${mat.quantity <= mat.minStock ? "text-red-600" : "text-slate-900"}`}>{mat.quantity}</span>
                      <span className="text-slate-400 ml-1 text-xs">{mat.unit}</span>
                    </td>
                    <td className="px-5 py-3.5 text-right text-slate-600">Rs. {mat.costPerUnit}</td>
                    <td className="px-5 py-3.5 text-slate-500">{mat.supplier ?? <span className="text-slate-300">—</span>}</td>
                    <td className="px-5 py-3.5 text-right">
                      <button onClick={() => handleEdit(mat)} className="text-blue-600 hover:text-blue-700 font-medium text-xs mr-3 cursor-pointer">Edit</button>
                      <button onClick={() => handleDelete(mat.id)} className="text-red-500 hover:text-red-600 font-medium text-xs cursor-pointer">Delete</button>
                    </td>
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
