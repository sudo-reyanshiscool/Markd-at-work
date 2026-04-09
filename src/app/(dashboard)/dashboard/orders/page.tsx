"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api-client";

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

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter) params.set("status", filter);
    if (search) params.set("search", search);
    const qs = params.toString() ? `?${params}` : "";
    api.get<Order[]>(`/api/orders${qs}`).then(setOrders).finally(() => setLoading(false));
  }, [filter, search]);

  useEffect(() => { load(); }, [load]);

  async function updateStatus(id: string, status: string) {
    await api.patch(`/api/orders/${id}`, { status });
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this order?")) return;
    await api.delete(`/api/orders/${id}`);
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Orders</h1>
      </div>

      <div className="flex gap-3 mb-4 flex-wrap">
        <input placeholder="Search orders..." value={search} onChange={(e) => setSearch(e.target.value)} className="border rounded-lg px-3 py-2 text-sm w-64" />
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
          <option value="">All Statuses</option>
          {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="animate-pulse">Loading...</div>
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
