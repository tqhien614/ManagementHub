"use client";

import { useEffect, useState, useCallback } from "react";
import { listAllUsers, approveUser, blockUser, type User } from "@/lib/api";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "active" | "blocked">("all");

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await listAllUsers();
    setUsers(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = filter === "all" ? users : users.filter((u) => u.status === filter);

  async function handleApprove(id: string) { await approveUser(id); load(); }
  async function handleBlock(id: string) { await blockUser(id); load(); }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Quản lý người dùng</h1>
        <div className="flex gap-1 text-sm">
          {(["all", "pending", "active", "blocked"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-md ${filter === f ? "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-black" : "hover:bg-neutral-100 dark:hover:bg-neutral-800"}`}
            >
              {f === "all" ? "Tất cả" : f === "pending" ? "Chờ duyệt" : f === "active" ? "Hoạt động" : "Đã khóa"}
            </button>
          ))}
        </div>
      </div>
      {loading ? (
        <p className="text-sm text-neutral-500">Đang tải...</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-neutral-500">Không có người dùng.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 dark:bg-neutral-900 text-left text-neutral-500">
              <tr>
                <th className="p-3 font-medium">Username</th>
                <th className="p-3 font-medium">Tên hiển thị</th>
                <th className="p-3 font-medium">Email</th>
                <th className="p-3 font-medium">Trạng thái</th>
                <th className="p-3 font-medium">Admin</th>
                <th className="p-3 font-medium">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-t border-neutral-200 dark:border-neutral-800">
                  <td className="p-3 font-mono">@{u.username}</td>
                  <td className="p-3">{u.display_name}</td>
                  <td className="p-3 text-neutral-500">{u.email}</td>
                  <td className="p-3">
                    <span className={
                      u.status === "active" ? "text-green-600" : u.status === "pending" ? "text-yellow-600" : "text-red-600"
                    }>{u.status}</span>
                  </td>
                  <td className="p-3">{u.is_admin ? "✓" : ""}</td>
                  <td className="p-3 space-x-2">
                    {u.status === "pending" && (
                      <button onClick={() => handleApprove(u.id)} className="text-green-600 hover:underline">Duyệt</button>
                    )}
                    {u.status === "active" && !u.is_admin && (
                      <button onClick={() => handleBlock(u.id)} className="text-red-600 hover:underline">Khóa</button>
                    )}
                    {u.status === "blocked" && (
                      <button onClick={() => handleApprove(u.id)} className="text-green-600 hover:underline">Mở khóa</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
