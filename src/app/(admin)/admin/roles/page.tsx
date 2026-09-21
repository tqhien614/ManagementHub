"use client";

import { useEffect, useState, useCallback } from "react";
import { request } from "@/lib/api";

type Role = { id: string; name: string; description: string | null; user_count: number };
type User = { id: string; username: string; display_name: string; email: string; status: string; is_admin: boolean };

export default function AdminRolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [assign, setAssign] = useState({ user_id: "", role_id: "" });

  const load = useCallback(async () => {
    const [r, u] = await Promise.all([request<Role[]>("/roles"), request<User[]>("/admin/users")]);
    setRoles(r.data || []);
    setUsers(u.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault();
    if (!assign.user_id || !assign.role_id) { alert("Chọn user và role"); return; }
    const { error } = await request("/roles/assign", { method: "POST", body: JSON.stringify(assign) });
    if (error) { alert(error); return; }
    setAssign({ user_id: "", role_id: "" });
    load();
  }

  async function handleRevoke(userId: string, roleId: string) {
    if (!confirm("Thu hồi vai trò?")) return;
    await request(`/roles/revoke?user_id=${userId}&role_id=${roleId}`, { method: "DELETE" });
    load();
  }

  if (loading) return <p className="text-sm text-neutral-500">Đang tải...</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Vai trò</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {roles.map((r) => (
          <div key={r.id} className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium capitalize">{r.name}</h3>
              <span className="text-xs text-neutral-500">{r.user_count} user</span>
            </div>
            <p className="text-sm text-neutral-500 mt-1">{r.description || "—"}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-4 space-y-3">
        <h3 className="font-medium">Gán vai trò</h3>
        <form onSubmit={handleAssign} className="flex gap-2 flex-wrap">
          <select value={assign.user_id} onChange={(e) => setAssign({ ...assign, user_id: e.target.value })} className="rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm">
            <option value="">Chọn user...</option>
            {users.map((u) => <option key={u.id} value={u.id}>@{u.username} ({u.display_name})</option>)}
          </select>
          <select value={assign.role_id} onChange={(e) => setAssign({ ...assign, role_id: e.target.value })} className="rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm">
            <option value="">Chọn role...</option>
            {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          <button type="submit" className="rounded-md bg-neutral-900 dark:bg-neutral-100 text-white dark:text-black px-4 py-2 text-sm">Gán</button>
        </form>
      </div>
    </div>
  );
}
