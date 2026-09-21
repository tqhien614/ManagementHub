"use client";

import { useEffect, useState, useCallback } from "react";
import { request } from "@/lib/api";

type User = { id: string; username: string; display_name: string; email: string; status: string; is_admin: boolean };
type Role = { id: string; name: string; description: string | null; user_count: number };
type Perm = { id: string; principal_type: string; principal_id: string; can_view: boolean; can_edit: boolean; can_admin: boolean };

export function PermissionManager({ type, targetId }: { type: "document" | "folder"; targetId: string }) {
  const [permlist, setPermlist] = useState<Perm[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newPerm, setNewPerm] = useState({ principal_type: "user", principal_id: "", can_view: true, can_edit: false, can_admin: false });

  const load = useCallback(async () => {
    const endpoint = type === "document" ? `/permissions/documents/${targetId}` : `/permissions/folders/${targetId}`;
    const [permRes, userRes, roleRes] = await Promise.all([
      request<Perm[]>(endpoint),
      request<User[]>("/admin/users"),
      request<Role[]>("/roles"),
    ]);
    setPermlist(permRes.data || []);
    setUsers(userRes.data || []);
    setRoles(roleRes.data || []);
    setLoading(false);
  }, [type, targetId]);

  useEffect(() => { load(); }, [load]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newPerm.principal_id) { alert("Chọn user/role"); return; }
    const endpoint = type === "document" ? `/permissions/documents/${targetId}` : `/permissions/folders/${targetId}`;
    const { error } = await request(endpoint, {
      method: "POST",
      body: JSON.stringify(newPerm),
    });
    if (error) { alert(error); return; }
    setShowAdd(false);
    setNewPerm({ principal_type: "user", principal_id: "", can_view: true, can_edit: false, can_admin: false });
    load();
  }

  async function handleDelete(permId: string) {
    const endpoint = type === "document" ? `/permissions/documents/${targetId}/${permId}` : `/permissions/folders/${targetId}/${permId}`;
    await request(endpoint, { method: "DELETE" });
    load();
  }

  function principalName(p: Perm): string {
    if (p.principal_type === "user") {
      const u = users.find((x) => x.id === p.principal_id);
      return u ? `@${u.username}` : p.principal_id.slice(0, 8);
    }
    const r = roles.find((x) => x.id === p.principal_id);
    return r ? `role:${r.name}` : p.principal_id.slice(0, 8);
  }

  if (loading) return <p className="text-sm text-neutral-500">Đang tải phân quyền...</p>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Phân quyền</h3>
        <button onClick={() => setShowAdd(!showAdd)} className="text-xs px-2 py-1 rounded border border-neutral-300 dark:border-neutral-700">
          {showAdd ? "Hủy" : "+ Gán quyền"}
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="space-y-2 rounded-md border border-neutral-200 dark:border-neutral-800 p-3">
          <select value={newPerm.principal_type} onChange={(e) => setNewPerm({ ...newPerm, principal_type: e.target.value })} className="w-full rounded border border-neutral-300 dark:border-neutral-700 bg-transparent px-2 py-1.5 text-sm">
            <option value="user">User</option>
            <option value="role">Role</option>
          </select>
          <select value={newPerm.principal_id} onChange={(e) => setNewPerm({ ...newPerm, principal_id: e.target.value })} required className="w-full rounded border border-neutral-300 dark:border-neutral-700 bg-transparent px-2 py-1.5 text-sm">
            <option value="">Chọn {newPerm.principal_type === "user" ? "user" : "role"}...</option>
            {newPerm.principal_type === "user"
              ? users.map((u) => <option key={u.id} value={u.id}>@{u.username} ({u.display_name})</option>)
              : roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          <div className="flex gap-3 text-sm">
            <label className="flex items-center gap-1"><input type="checkbox" checked={newPerm.can_view} onChange={(e) => setNewPerm({ ...newPerm, can_view: e.target.checked })} /> Xem</label>
            <label className="flex items-center gap-1"><input type="checkbox" checked={newPerm.can_edit} onChange={(e) => setNewPerm({ ...newPerm, can_edit: e.target.checked })} /> Sửa</label>
            <label className="flex items-center gap-1"><input type="checkbox" checked={newPerm.can_admin} onChange={(e) => setNewPerm({ ...newPerm, can_admin: e.target.checked })} /> Quản trị</label>
          </div>
          <button type="submit" className="rounded bg-neutral-900 dark:bg-neutral-100 text-white dark:text-black px-3 py-1.5 text-sm">Gán</button>
        </form>
      )}

      {permlist.length === 0 ? (
        <p className="text-xs text-neutral-500">Chưa có phân quyền cụ thể. Document kế thừa quyền từ folder cha.</p>
      ) : (
        <div className="space-y-1">
          {permlist.map((p) => (
            <div key={p.id} className="flex items-center justify-between text-sm rounded border border-neutral-200 dark:border-neutral-800 px-3 py-1.5">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">{p.principal_type}</span>
                <span>{principalName(p)}</span>
                <span className="text-xs text-neutral-500">
                  {p.can_view && "👁"} {p.can_edit && "✏️"} {p.can_admin && "⚙️"}
                </span>
              </div>
              <button onClick={() => handleDelete(p.id)} className="text-xs text-red-600 hover:underline">Xóa</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
