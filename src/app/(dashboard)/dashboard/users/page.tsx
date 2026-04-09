"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api-client";
import { useToast } from "@/components/toast";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  _count: { orders: number; stockMovements: number };
}

const roles = ["ADMIN", "MANAGER", "WORKER"];
const roleColors: Record<string, string> = {
  ADMIN: "bg-red-100 text-red-800",
  MANAGER: "bg-blue-100 text-blue-800",
  WORKER: "bg-gray-100 text-gray-800",
};

const emptyForm = { name: "", email: "", password: "", role: "WORKER" };

export default function UsersPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api.get<User[]>("/api/users")
      .then(setUsers)
      .catch(() => toast("Failed to load users. You may not have admin access.", "error"))
      .finally(() => setLoading(false));
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/api/auth/register", form);
      toast("User created", "success");
      setForm(emptyForm);
      setShowForm(false);
      load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to create user", "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRoleChange(id: string, role: string) {
    try {
      await api.patch(`/api/users/${id}`, { role });
      toast(`Role updated to ${role}`, "success");
      load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to update role", "error");
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/api/users/${id}`);
      toast("User deleted", "success");
      load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to delete user", "error");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <button onClick={() => { setShowForm(!showForm); setForm(emptyForm); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
          {showForm ? "Cancel" : "+ Add User"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white border rounded-xl p-6 mb-6">
          <h2 className="font-semibold mb-4">Create New User</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Name *</label>
              <input placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border rounded-lg px-3 py-2 text-sm w-full" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Email *</label>
              <input type="email" placeholder="email@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="border rounded-lg px-3 py-2 text-sm w-full" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Password *</label>
              <input type="password" placeholder="Min 6 characters" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="border rounded-lg px-3 py-2 text-sm w-full" required minLength={6} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Role</label>
              <div className="flex gap-2">
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="border rounded-lg px-3 py-2 text-sm flex-1">
                  {roles.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
                <button type="submit" disabled={submitting} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                  {submitting ? "..." : "Create"}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {loading ? (
        <div className="bg-white border rounded-xl overflow-hidden">
          {[1,2,3].map((i) => <div key={i} className="h-14 border-b animate-pulse" />)}
        </div>
      ) : (
        <div className="bg-white border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Name</th>
                <th className="text-left px-4 py-3 font-medium">Email</th>
                <th className="text-left px-4 py-3 font-medium">Role</th>
                <th className="text-right px-4 py-3 font-medium">Orders</th>
                <th className="text-right px-4 py-3 font-medium">Movements</th>
                <th className="text-left px-4 py-3 font-medium">Joined</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-4 py-3 font-medium">{user.name}</td>
                  <td className="px-4 py-3 text-gray-500">{user.email}</td>
                  <td className="px-4 py-3">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      className={`text-xs font-medium px-2 py-1 rounded ${roleColors[user.role]} border-0 cursor-pointer`}
                    >
                      {roles.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right">{user._count.orders}</td>
                  <td className="px-4 py-3 text-right">{user._count.stockMovements}</td>
                  <td className="px-4 py-3 text-gray-400">{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleDelete(user.id, user.name)} className="text-red-600 hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-gray-400">No users found</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
