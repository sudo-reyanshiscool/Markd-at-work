"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { redirect } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { href: "/dashboard/inventory", label: "Inventory", icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" },
  { href: "/dashboard/materials", label: "Raw Materials", icon: "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" },
  { href: "/dashboard/orders", label: "Orders", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" },
  { href: "/dashboard/stock", label: "Stock Movements", icon: "M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" },
  { href: "/dashboard/users", label: "Users", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z", adminOnly: true },
] as const;

function NavIcon({ d }: { d: string }) {
  return (
    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center font-bold text-lg text-white animate-pulse">M</div>
          <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (!session) redirect("/login");

  const roleColors: Record<string, string> = {
    ADMIN: "bg-red-500/20 text-red-300",
    MANAGER: "bg-blue-500/20 text-blue-300",
    WORKER: "bg-slate-500/20 text-slate-300",
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar */}
      <aside className="w-[260px] bg-slate-900 text-slate-300 flex flex-col shrink-0">
        {/* Logo */}
        <div className="px-6 py-5 flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-sm text-white">M</div>
          <div>
            <p className="text-white font-semibold text-sm leading-none">Markd at Work</p>
            <p className="text-slate-500 text-xs mt-0.5">Factory Management</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 px-3 mb-2">Menu</p>
          {navItems.map((item) => {
            if ("adminOnly" in item && item.adminOnly && session.user?.role !== "ADMIN") return null;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <NavIcon d={item.icon} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User info */}
        <div className="px-4 py-4 border-t border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-slate-700 rounded-full flex items-center justify-center text-sm font-semibold text-white uppercase">
              {session.user?.name?.[0] ?? "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{session.user?.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${roleColors[session.user?.role ?? ""] ?? "bg-slate-700 text-slate-300"}`}>
                  {session.user?.role}
                </span>
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-red-400 cursor-pointer"
              title="Sign out"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 overflow-auto animate-fade-in">{children}</main>
    </div>
  );
}
