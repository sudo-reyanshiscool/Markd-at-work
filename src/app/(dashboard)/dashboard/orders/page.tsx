"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api-client";
import { useToast } from "@/components/toast";

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
}

interface OrderItemData {
  inventoryItemId: string;
  quantity: number;
  unitPrice: number;
  notes: string;
}

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  inventoryItem: { name: string; sku: string };
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string | null;
  status: string;
  totalAmount: number;
  deadline: string | null;
  notes: string | null;
  createdAt: string;
  items: OrderItem[];
  createdBy: { name: string };
}

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  PROCESSING: "bg-purple-100 text-purple-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
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

  // Create form state
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
    api.get<Order[]>(`/api/orders${qs}`)
      .then(setOrders)
      .catch(() => toast("Failed to load orders", "error"))
      .finally(() => setLoading(false));
  }, [filter, search, toast]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    api.get<InventoryItem[]>("/api/inventory").then(setInventoryItems).catch(() => {});
  }, []);

  function resetForm() {
    setCustomerName("");
    setCustomerPhone("");
    setDeadline("");
    setNotes("");
    setItems([{ ...emptyItem }]);
    setShowForm(false);
  }

  function addItem() {
    setItems([...items, { ...emptyItem }]);
  }

  function removeItem(index: number) {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  }

  function updateItem(index: number, field: keyof OrderItemData, value: string | number) {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!customerName.trim()) { toast("Customer name is required", "error"); return; }
    if (items.some((i) => !i.inventoryItemId)) { toast("Select an item for each line", "error"); return; }

    setSubmitting(true);
    try {
      const payload = {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim() || undefined,
        deadline: deadline ? new Date(deadline).toISOString() : undefined,
        notes: notes.trim() || undefined,
        items: items.map((i) => ({
          inventoryItemId: i.inventoryItemId,
          quantity: Number(i.quantity),
          unitPrice: Number(i.unitPrice),
          notes: i.notes.trim() || undefined,
        })),
      };
      await api.post("/api/orders", payload);
      toast("Order created successfully", "success");
      resetForm();
      load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to create order", "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function updateStatus(id: string, status: string) {
    try {
      await api.patch(`/api/orders/${id}`, { status });
      toast(`Order updated to ${status}`, "success");
      load();
    } catch {
      toast("Failed to update order status", "error");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this order? This cannot be undone.")) return;
    try {
      await api.delete(`/api/orders/${id}`);
      toast("Order deleted", "success");
      load();
    } catch {
      toast("Failed to delete order", "error");
    }
  }

  const orderTotal = items.reduce((sum, i) => sum + Number(i.quantity) * Number(i.unitPrice), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Orders</h1>
        <button
          onClick={() => { setShowForm(!showForm); if (showForm) resetForm(); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          {showForm ? "Cancel" : "+ New Order"}
        </button>
      </div>

      {/* Create Order Form */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-white border rounded-xl p-6 mb-6">
          <h2 className="font-semibold mb-4">Create New Order</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Customer Name *</label>
              <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="border rounded-lg px-3 py-2 text-sm w-full" placeholder="e.g. Sharma Textiles" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Phone</label>
              <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="border rounded-lg px-3 py-2 text-sm w-full" placeholder="+91 98765 43210" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Deadline</label>
              <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="border rounded-lg px-3 py-2 text-sm w-full" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
              <input value={notes} onChange={(e) => setNotes(e.target.value)} className="border rounded-lg px-3 py-2 text-sm w-full" placeholder="Special instructions..." />
            </div>
          </div>

          {/* Line items */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-500">Order Items</label>
              <button type="button" onClick={addItem} className="text-blue-600 text-xs hover:underline">+ Add item</button>
            </div>
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  <select
                    value={item.inventoryItemId}
                    onChange={(e) => updateItem(idx, "inventoryItemId", e.target.value)}
                    className="col-span-5 border rounded-lg px-3 py-2 text-sm"
                    required
                  >
                    <option value="">Select item...</option>
                    {inventoryItems.map((inv) => (
                      <option key={inv.id} value={inv.id}>{inv.name} ({inv.sku})</option>
                    ))}
                  </select>
                  <input
                    type="number" min="1" placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => updateItem(idx, "quantity", Number(e.target.value))}
                    className="col-span-2 border rounded-lg px-3 py-2 text-sm"
                    required
                  />
                  <input
                    type="number" min="0" step="0.01" placeholder="Unit Price"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(idx, "unitPrice", Number(e.target.value))}
                    className="col-span-2 border rounded-lg px-3 py-2 text-sm"
                  />
                  <input
                    placeholder="Notes"
                    value={item.notes}
                    onChange={(e) => updateItem(idx, "notes", e.target.value)}
                    className="col-span-2 border rounded-lg px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="col-span-1 text-red-400 hover:text-red-600 text-center"
                    disabled={items.length === 1}
                  >
                    x
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Total: Rs. {orderTotal.toLocaleString()}</p>
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Create Order"}
            </button>
          </div>
        </form>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <input placeholder="Search orders..." value={search} onChange={(e) => setSearch(e.target.value)} className="border rounded-lg px-3 py-2 text-sm w-64" />
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
          <option value="">All Statuses</option>
          {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Order list */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map((i) => <div key={i} className="bg-white border rounded-xl p-5 h-16 animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="bg-white border rounded-xl p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <span className="font-bold">{order.orderNumber}</span>
                    <span className="text-gray-500 ml-2">{order.customerName}</span>
                    {order.customerPhone && <span className="text-gray-400 ml-2 text-sm">{order.customerPhone}</span>}
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[order.status]}`}>{order.status}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="font-medium">Rs. {order.totalAmount.toLocaleString()}</span>
                  {order.deadline && <span className="text-gray-400">{new Date(order.deadline).toLocaleDateString()}</span>}
                  <select value={order.status} onChange={(e) => updateStatus(order.id, e.target.value)} className="border rounded px-2 py-1 text-xs">
                    {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <button onClick={() => setExpandedId(expandedId === order.id ? null : order.id)} className="text-blue-600 hover:underline text-xs">
                    {expandedId === order.id ? "Hide" : "Details"}
                  </button>
                  <button onClick={() => handleDelete(order.id)} className="text-red-600 hover:underline text-xs">Delete</button>
                </div>
              </div>

              {expandedId === order.id && (
                <div className="mt-4 border-t pt-4">
                  {order.notes && <p className="text-sm text-gray-500 mb-3">Notes: {order.notes}</p>}
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500">
                        <th className="pb-2">Item</th>
                        <th className="pb-2">SKU</th>
                        <th className="pb-2 text-right">Qty</th>
                        <th className="pb-2 text-right">Price</th>
                        <th className="pb-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map((item) => (
                        <tr key={item.id}>
                          <td className="py-1">{item.inventoryItem.name}</td>
                          <td className="py-1 text-gray-400">{item.inventoryItem.sku}</td>
                          <td className="py-1 text-right">{item.quantity}</td>
                          <td className="py-1 text-right">{item.unitPrice}</td>
                          <td className="py-1 text-right font-medium">{item.quantity * item.unitPrice}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="text-xs text-gray-400 mt-2">Created by {order.createdBy.name} on {new Date(order.createdAt).toLocaleString()}</p>
                </div>
              )}
            </div>
          ))}
          {orders.length === 0 && <p className="text-center text-gray-400 py-12">No orders found</p>}
        </div>
      )}
    </div>
  );
}
