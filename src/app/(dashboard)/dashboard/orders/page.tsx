"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api-client";
import { useToast } from "@/components/toast";
import { PageHeader, Card, Button, Input, Select, Badge, EmptyState } from "@/components/ui";

interface InventoryItem { id: string; name: string; sku: string }
interface OrderItemData { inventoryItemId: string; quantity: number; unitPrice: number; notes: string }
interface OrderItem { id: string; quantity: number; unitPrice: number; inventoryItem: { name: string; sku: string } }
interface Order {
  id: string; orderNumber: string; customerName: string; customerPhone: string | null; status: string;
  totalAmount: number; deadline: string | null; notes: string | null; createdAt: string; items: OrderItem[]; createdBy: { name: string };
}

const statusBadge: Record<string, "amber" | "blue" | "violet" | "green" | "red"> = {
  PENDING: "amber", CONFIRMED: "blue", PROCESSING: "violet", COMPLETED: "green", CANCELLED: "red",
};
const statuses = ["PENDING", "CONFIRMED", "PROCESSING", "COMPLETED", "CANCELLED"];
const emptyItem: OrderItemData = { inventoryItemId: "", quantity: 1, unitPrice: 0, notes: "" };

export default function OrdersPage() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deadline, setDeadline] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<OrderItemData[]>([{ ...emptyItem }]);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter) params.set("status", filter);
    if (search) params.set("search", search);
    const qs = params.toString() ? `?${params}` : "";
    api.get<Order[]>(`/api/orders${qs}`).then(setOrders).catch(() => toast("Failed to load orders", "error")).finally(() => setLoading(false));
  }, [filter, search, toast]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { api.get<InventoryItem[]>("/api/inventory").then(setInventoryItems).catch(() => {}); }, []);

  function resetForm() { setCustomerName(""); setCustomerPhone(""); setDeadline(""); setNotes(""); setItems([{ ...emptyItem }]); setShowForm(false); }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (items.some((i) => !i.inventoryItemId)) { toast("Select an item for each line", "error"); return; }
    setSubmitting(true);
    try {
      await api.post("/api/orders", {
        customerName: customerName.trim(), customerPhone: customerPhone.trim() || undefined,
        deadline: deadline ? new Date(deadline).toISOString() : undefined, notes: notes.trim() || undefined,
        items: items.map((i) => ({ inventoryItemId: i.inventoryItemId, quantity: Number(i.quantity), unitPrice: Number(i.unitPrice), notes: i.notes.trim() || undefined })),
      });
      toast("Order created", "success"); resetForm(); load();
    } catch (err) { toast(err instanceof Error ? err.message : "Failed to create order", "error"); }
    finally { setSubmitting(false); }
  }

  async function updateStatus(id: string, status: string) {
    try { await api.patch(`/api/orders/${id}`, { status }); toast(`Status updated`, "success"); load(); }
    catch { toast("Failed to update status", "error"); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this order?")) return;
    try { await api.delete(`/api/orders/${id}`); toast("Order deleted", "success"); load(); }
    catch { toast("Failed to delete order", "error"); }
  }

  const orderTotal = items.reduce((sum, i) => sum + Number(i.quantity) * Number(i.unitPrice), 0);

  return (
    <div>
      <PageHeader title="Orders" description="Create and manage customer orders"
        action={<Button onClick={() => { showForm ? resetForm() : setShowForm(true); }}>{showForm ? "Cancel" : "+ New Order"}</Button>}
      />

      {showForm && (
        <Card className="p-6 mb-6 animate-fade-in">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">Create New Order</h2>
          <form onSubmit={handleCreate}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
              <Input label="Customer Name *" placeholder="e.g. Sharma Textiles" value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />
              <Input label="Phone" placeholder="+91 98765 43210" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
              <Input label="Deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
              <Input label="Notes" placeholder="Special instructions..." value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>

            <div className="mb-5">
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Order Items</label>
                <button type="button" onClick={() => setItems([...items, { ...emptyItem }])} className="text-blue-600 text-xs font-medium hover:text-blue-700 cursor-pointer">+ Add item</button>
              </div>
              <div className="space-y-2">
                {items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-5">
                      <Select value={item.inventoryItemId} onChange={(e) => { const u = [...items]; u[idx] = { ...u[idx], inventoryItemId: e.target.value }; setItems(u); }} required>
                        <option value="">Select item...</option>
                        {inventoryItems.map((inv) => <option key={inv.id} value={inv.id}>{inv.name} ({inv.sku})</option>)}
                      </Select>
                    </div>
                    <div className="col-span-2"><Input type="number" min={1} placeholder="Qty" value={item.quantity} onChange={(e) => { const u = [...items]; u[idx] = { ...u[idx], quantity: Number(e.target.value) }; setItems(u); }} required /></div>
                    <div className="col-span-2"><Input type="number" min={0} step="0.01" placeholder="Price" value={item.unitPrice} onChange={(e) => { const u = [...items]; u[idx] = { ...u[idx], unitPrice: Number(e.target.value) }; setItems(u); }} /></div>
                    <div className="col-span-2"><Input placeholder="Notes" value={item.notes} onChange={(e) => { const u = [...items]; u[idx] = { ...u[idx], notes: e.target.value }; setItems(u); }} /></div>
                    <div className="col-span-1 flex justify-center">
                      <button type="button" onClick={() => items.length > 1 && setItems(items.filter((_, i) => i !== idx))} className="text-slate-300 hover:text-red-500 p-2 cursor-pointer" disabled={items.length === 1}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <p className="text-sm font-semibold text-slate-900">Total: Rs. {orderTotal.toLocaleString()}</p>
              <Button type="submit" disabled={submitting}>{submitting ? "Creating..." : "Create Order"}</Button>
            </div>
          </form>
        </Card>
      )}

      <div className="flex gap-3 mb-5 flex-wrap">
        <Input placeholder="Search orders..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-64" />
        <Select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All Statuses</option>
          {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-white rounded-2xl animate-pulse border border-slate-100" />)}</div>
      ) : orders.length === 0 ? (
        <Card><EmptyState message="No orders found" /></Card>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Card key={order.id} className="p-5">
              <div className="flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V19.5a2.25 2.25 0 002.25 2.25h.75" /></svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{order.orderNumber}</p>
                      <p className="text-xs text-slate-500">{order.customerName}{order.customerPhone && ` · ${order.customerPhone}`}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge color={statusBadge[order.status] ?? "gray"}>{order.status}</Badge>
                    <span className="font-semibold text-sm text-slate-900">Rs. {order.totalAmount.toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    {order.deadline && <span className="bg-slate-50 px-2 py-1 rounded-lg">Due: {new Date(order.deadline).toLocaleDateString()}</span>}
                    <span>Created {new Date(order.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <select value={order.status} onChange={(e) => updateStatus(order.id, e.target.value)} className="border border-slate-200 rounded-lg px-2 py-1 text-xs bg-white cursor-pointer">
                      {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <button onClick={() => setExpandedId(expandedId === order.id ? null : order.id)} className="text-blue-600 hover:text-blue-700 text-xs font-medium cursor-pointer">{expandedId === order.id ? "Hide" : "Details"}</button>
                    <button onClick={() => handleDelete(order.id)} className="text-red-500 hover:text-red-600 text-xs font-medium cursor-pointer">Delete</button>
                  </div>
                </div>
              </div>
              {expandedId === order.id && (
                <div className="mt-4 pt-4 border-t border-slate-100 animate-fade-in">
                  {order.notes && <p className="text-xs text-slate-500 mb-3 bg-slate-50 px-3 py-2 rounded-lg">Notes: {order.notes}</p>}
                  <table className="w-full text-sm">
                    <thead><tr className="text-xs text-slate-500"><th className="text-left pb-2">Item</th><th className="text-left pb-2">SKU</th><th className="text-right pb-2">Qty</th><th className="text-right pb-2">Price</th><th className="text-right pb-2">Total</th></tr></thead>
                    <tbody>{order.items.map((item) => (
                      <tr key={item.id}><td className="py-1.5 font-medium text-slate-900">{item.inventoryItem.name}</td><td className="py-1.5 text-slate-400 font-mono text-xs">{item.inventoryItem.sku}</td><td className="py-1.5 text-right">{item.quantity}</td><td className="py-1.5 text-right text-slate-500">{item.unitPrice}</td><td className="py-1.5 text-right font-semibold">{item.quantity * item.unitPrice}</td></tr>
                    ))}</tbody>
                  </table>
                  <p className="text-[10px] text-slate-400 mt-3">Created by {order.createdBy.name} · {new Date(order.createdAt).toLocaleString()}</p>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
