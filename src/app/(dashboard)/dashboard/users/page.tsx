"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api-client";
import { useToast } from "@/components/toast";
import { PageHeader, Card, Button, Input, Select, Badge, EmptyState } from "@/components/ui";

interface User {
  id: string; name: string; email: string; role: string; createdAt: string;
  _count: { orders: number; stockMovements: number };
}

const roles = ["ADMIN", "MANAGER", "WORKER"];
const roleBadge: Record<string, "red" | "blue" | "gray"> = { ADMIN: "red", MANAGER: "blue", WORKER: "gray" };
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
    api.get<User[]>("/api/users").then(setUsers).catch(() => toast("Failed to load users", "error")).finally(() => setLoading(false));
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault(); setSubmitting(true);
    try { await api.post("/api/auth/register", form); toast("User created", "success"); setForm(emptyForm); setShowForm(false); load(); }
    catch (err) { toast(err instanceof Error ? err.message : "Failed to create user", "error"); }
    finally { setSubmitting(false); }
  }

  async function handleRoleChange(id: string, role: string) {
    try { await api.patch(`/api/users/${id}`, { role }); toast(`Role updated`, "success"); load(); }
    catch (err) { toast(err instanceof Error ? err.message : "Failed to update role", "error"); }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete user "${name}"?`)) return;
    try { await api.delete(`/api/users/${id}`); toast("User deleted", "success"); load(); }
    catch (err) { toast(err instanceof Error ? err.message : "Failed to delete user", "error"); }
  }

  return (
    <div>
      <PageHeader title="User Management" description="Manage team members and their roles"
        action={<Button onClick={() => { setShowForm(!showForm); setForm(emptyForm); }}>{showForm ? "Cancel" : "+ Add User"}</Button>}
      />

      {showForm && (
        <Card className="p-6 mb-6 animate-fade-in">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">Create New User</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input label="Name *" placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <Input label="Email *" type="email" placeholder="email@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            <Input label="Password *" type="password" placeholder="Min 6 characters" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
            <div className="flex items-end gap-2">
              <div className="flex-1"><Select label="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>{roles.map((r) => <option key={r} value={r}>{r}</option>)}</Select></div>
              <Button type="submit" disabled={submitting}>{submitting ? "..." : "Create"}</Button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        {loading ? (
          <div className="p-8 space-y-3">{[1,2,3].map(i => <div key={i} className="h-12 bg-slate-100 rounded-lg animate-pulse" />)}</div>
        ) : users.length === 0 ? (<EmptyState message="No users found" />) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead><tr className="border-b border-slate-100">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Orders</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Movements</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Joined</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-50">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-xs font-semibold text-slate-600 uppercase">{user.name[0]}</div>
                        <div><p className="font-medium text-slate-900">{user.name}</p><p className="text-xs text-slate-500">{user.email}</p></div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <select value={user.role} onChange={(e) => handleRoleChange(user.id, e.target.value)} className="text-xs font-medium border border-slate-200 rounded-lg px-2 py-1 bg-white cursor-pointer">
                        {roles.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </td>
                    <td className="px-5 py-3.5 text-right text-slate-600">{user._count.orders}</td>
                    <td className="px-5 py-3.5 text-right text-slate-600">{user._count.stockMovements}</td>
                    <td className="px-5 py-3.5 text-slate-400 text-xs">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="px-5 py-3.5 text-right">
                      <button onClick={() => handleDelete(user.id, user.name)} className="text-red-500 hover:text-red-600 text-xs font-medium cursor-pointer">Delete</button>
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
