"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { redirect } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/inventory", label: "Inventory" },
  { href: "/dashboard/materials", label: "Raw Materials" },
  { href: "/dashboard/orders", label: "Orders" },
  { href: "/dashboard/stock", label: "Stock Movements" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!session) redirect("/login");

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r flex flex-col">
        <div className="p-6 border-b">
          <h1 className="text-lg font-bold">Markd at Work</h1>
          <p className="text-xs text-gray-500 mt-1">Factory Management</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t">
          <p className="text-xs text-gray-500 truncate">{session.user?.name}</p>
          <p className="text-xs text-gray-400 truncate">{session.user?.email}</p>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="mt-2 text-xs text-red-500 hover:underline"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
}
