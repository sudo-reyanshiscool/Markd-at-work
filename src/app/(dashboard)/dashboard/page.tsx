"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { useToast } from "@/components/toast";
import Link from "next/link";

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
  PENDING: "bg-amber-50 text-amber-700 border border-amber-200",
  CONFIRMED: "bg-blue-50 text-blue-700 border border-blue-200",
  PROCESSING: "bg-violet-50 text-violet-700 border border-violet-200",
  COMPLETED: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  CANCELLED: "bg-red-50 text-red-700 border border-red-200",
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

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-slate-200 rounded-lg" />
        <div className="grid grid-cols-4 gap-5">{[1,2,3,4].map(i => <div key={i} className="h-28 bg-white rounded-2xl" />)}</div>
        <div className="grid grid-cols-2 gap-5">{[1,2].map(i => <div key={i} className="h-64 bg-white rounded-2xl" />)}</div>
      </div>
    );
  }
  if (!data) return <div className="text-slate-400">Failed to load dashboard</div>;

  const totalOrders = Object.values(data.counts.orders).reduce((a, b) => a + b, 0);

  const stats = [
    { label: "Inventory Items", value: data.counts.inventoryItems, color: "from-blue-500 to-blue-600", href: "/dashboard/inventory" },
    { label: "Raw Materials", value: data.counts.rawMaterials, color: "from-emerald-500 to-emerald-600", href: "/dashboard/materials" },
    { label: "Total Orders", value: totalOrders, color: "from-violet-500 to-violet-600", href: "/dashboard/orders" },
    { label: "Processing", value: data.counts.orders.PROCESSING ?? 0, color: "from-amber-500 to-amber-600", href: "/dashboard/orders?status=PROCESSING" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Overview of your factory operations</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href} className="group">
            <div className="bg-white rounded-2xl p-5 shadow-[var(--card-shadow)] hover:shadow-[var(--card-shadow-lg)] transition-shadow border border-slate-100">
              <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
              <div className="flex items-end justify-between mt-2">
                <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity`}>
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Order status pills */}
      {Object.keys(data.counts.orders).length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-[var(--card-shadow)] border border-slate-100 mb-8">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">Orders by Status</h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(data.counts.orders).map(([status, count]) => (
              <span key={status} className={`px-3 py-1.5 rounded-full text-xs font-semibold ${statusColors[status] ?? "bg-slate-100 text-slate-600"}`}>
                {status} &middot; {count}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent orders */}
        <div className="bg-white rounded-2xl p-6 shadow-[var(--card-shadow)] border border-slate-100">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-slate-900">Recent Orders</h2>
            <Link href="/dashboard/orders" className="text-xs text-blue-600 hover:text-blue-700 font-medium">View all</Link>
          </div>
          <div className="space-y-3">
            {data.recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V19.5a2.25 2.25 0 002.25 2.25h.75" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{order.orderNumber}</p>
                    <p className="text-xs text-slate-500">{order.customerName}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusColors[order.status] ?? ""}`}>{order.status}</span>
                  <p className="text-xs text-slate-500 mt-0.5">Rs. {order.totalAmount.toLocaleString()}</p>
                </div>
              </div>
            ))}
            {data.recentOrders.length === 0 && (
              <p className="text-sm text-slate-400 py-4 text-center">No orders yet</p>
            )}
          </div>
        </div>

        {/* Low stock alerts */}
        <div className="bg-white rounded-2xl p-6 shadow-[var(--card-shadow)] border border-slate-100">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-slate-900">Low Stock Alerts</h2>
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          </div>
          <div className="space-y-3">
            {[...data.lowStock.inventory, ...data.lowStock.materials].map((item) => (
              <div key={item.id} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center">
                    <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.sku}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-red-600">{item.quantity}</p>
                  <p className="text-[10px] text-slate-400">min: {item.minStock}</p>
                </div>
              </div>
            ))}
            {data.lowStock.inventory.length === 0 && data.lowStock.materials.length === 0 && (
              <div className="text-center py-6">
                <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm text-slate-500">All stock levels OK</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
