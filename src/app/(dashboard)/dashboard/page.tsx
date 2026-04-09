"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { useToast } from "@/components/toast";

interface DashboardData {
  counts: {
    inventoryItems: number;
    rawMaterials: number;
    orders: Record<string, number>;
  };
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    customerName: string;
    status: string;
    totalAmount: number;
    createdAt: string;
  }>;
  lowStock: {
    inventory: Array<{ id: string; name: string; sku: string; quantity: number; minStock: number }>;
    materials: Array<{ id: string; name: string; sku: string; quantity: number; minStock: number }>;
  };
}

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  PROCESSING: "bg-purple-100 text-purple-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export default function DashboardPage() {
  const { toast } = useToast();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<DashboardData>("/api/dashboard")
      .then(setData)
      .catch(() => toast("Failed to load dashboard data", "error"))
      .finally(() => setLoading(false));
  }, [toast]);

  if (loading) return <div className="animate-pulse">Loading dashboard...</div>;
  if (!data) return <div>Failed to load dashboard</div>;

  const totalOrders = Object.values(data.counts.orders).reduce((a, b) => a + b, 0);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Inventory Items" value={data.counts.inventoryItems} />
        <StatCard label="Raw Materials" value={data.counts.rawMaterials} />
        <StatCard label="Total Orders" value={totalOrders} />
        <StatCard label="Processing" value={data.counts.orders.PROCESSING ?? 0} accent />
      </div>

      {/* Order status breakdown */}
      <div className="bg-white rounded-xl border p-6 mb-8">
        <h2 className="font-semibold mb-4">Orders by Status</h2>
        <div className="flex flex-wrap gap-3">
          {Object.entries(data.counts.orders).map(([status, count]) => (
            <span key={status} className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[status] ?? "bg-gray-100"}`}>
              {status}: {count}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent orders */}
        <div className="bg-white rounded-xl border p-6">
          <h2 className="font-semibold mb-4">Recent Orders</h2>
          <div className="space-y-3">
            {data.recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium">{order.orderNumber}</span>
                  <span className="text-gray-500 ml-2">{order.customerName}</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[order.status] ?? ""}`}>
                  {order.status}
                </span>
              </div>
            ))}
            {data.recentOrders.length === 0 && <p className="text-gray-400 text-sm">No orders yet</p>}
          </div>
        </div>

        {/* Low stock alerts */}
        <div className="bg-white rounded-xl border p-6">
          <h2 className="font-semibold mb-4">Low Stock Alerts</h2>
          <div className="space-y-2">
            {[...data.lowStock.inventory, ...data.lowStock.materials].map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <span>{item.name} <span className="text-gray-400">({item.sku})</span></span>
                <span className="text-red-600 font-medium">{item.quantity} / {item.minStock}</span>
              </div>
            ))}
            {data.lowStock.inventory.length === 0 && data.lowStock.materials.length === 0 && (
              <p className="text-gray-400 text-sm">All stock levels OK</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className={`rounded-xl border p-5 ${accent ? "bg-blue-50 border-blue-200" : "bg-white"}`}>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
    </div>
  );
}
