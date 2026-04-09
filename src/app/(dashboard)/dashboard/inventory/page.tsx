"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api-client";
import { useToast } from "@/components/toast";
import { PageHeader, Card, Button, Input, EmptyState } from "@/components/ui";

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
      setForm(emptyForm); setEditId(null); setShowForm(false); load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to save item", "error");
    } finally { setSubmitting(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this item?")) return;
    try { await api.delete(`/api/inventory/${id}`); toast("Item deleted", "success"); load(); }
    catch { toast("Failed to delete item", "error"); }
  }

  function handleEdit(item: InventoryItem) {
    setForm({ name: item.name, sku: item.sku, category: item.category, quantity: item.quantity, unit: item.unit, minStock: item.minStock, description: item.description ?? "" });
    setEditId(item.id); setShowForm(true);
  }

  return (
    <div>
      <PageHeader
        title="Inventory"
        description="Manage finished garments and products"
        action={
          <Button onClick={() => { setShowForm(!showForm); setEditId(null); setForm(emptyForm); }}>
            {showForm ? "Cancel" : "+ Add Item"}
          </Button>
        }
      />

      {showForm && (
        <Card className="p-6 mb-6 animate-fade-in">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">{editId ? "Edit Item" : "New Inventory Item"}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input label="Name *" placeholder="e.g. Men's Kurta - White" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <Input label="SKU *" placeholder="e.g. MK-WHT-001" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} required />
            <Input label="Category *" placeholder="e.g. Kurta" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required />
            <Input label="Quantity" type="number" min={0} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} />
            <Input label="Unit" placeholder="pcs" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
            <Input label="Min Stock Alert" type="number" min={0} value={form.minStock} onChange={(e) => setForm({ ...form, minStock: Number(e.target.value) })} />
            <div className="md:col-span-2">
              <Input label="Description" placeholder="Optional description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={submitting} className="w-full">{submitting ? "Saving..." : editId ? "Update" : "Create"}</Button>
            </div>
          </form>
        </Card>
      )}

      <div className="mb-5">
        <Input placeholder="Search by name or SKU..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-md" />
      </div>

      <Card>
        {loading ? (
          <div className="p-8 space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-10 bg-slate-100 rounded-lg animate-pulse" />)}</div>
        ) : items.length === 0 ? (
          <EmptyState message="No items found" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">SKU</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                  <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Quantity</th>
                  <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Min Stock</th>
                  <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {items.map((item) => (
                  <tr key={item.id} className={item.quantity <= item.minStock ? "bg-red-50/50" : ""}>
                    <td className="px-5 py-3.5 font-medium text-slate-900">{item.name}</td>
                    <td className="px-5 py-3.5 text-slate-500 font-mono text-xs">{item.sku}</td>
                    <td className="px-5 py-3.5"><span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md text-xs font-medium">{item.category}</span></td>
                    <td className="px-5 py-3.5 text-right">
                      <span className={`font-semibold ${item.quantity <= item.minStock ? "text-red-600" : "text-slate-900"}`}>{item.quantity}</span>
                      <span className="text-slate-400 ml-1 text-xs">{item.unit}</span>
                    </td>
                    <td className="px-5 py-3.5 text-right text-slate-400">{item.minStock}</td>
                    <td className="px-5 py-3.5 text-right">
                      <button onClick={() => handleEdit(item)} className="text-blue-600 hover:text-blue-700 font-medium text-xs mr-3 cursor-pointer">Edit</button>
                      <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-600 font-medium text-xs cursor-pointer">Delete</button>
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
