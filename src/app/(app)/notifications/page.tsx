"use client";

import { useEffect, useState, useCallback } from "react";
import { request } from "@/lib/api";

type Notification = { id: string; user_id: string; type: string; message: string; ref_type: string | null; ref_id: string | null; is_read: boolean; created_at: string };

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await request<Notification[]>("/notifications");
    setNotifs(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function markRead(id: string) {
    await request(`/notifications/${id}/read`, { method: "POST" });
    load();
  }

  async function markAllRead() {
    await request("/notifications/read-all", { method: "POST" });
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Thông báo</h1>
        {notifs.some((n) => !n.is_read) && (
          <button onClick={markAllRead} className="text-sm px-3 py-1 rounded-md border border-neutral-300 dark:border-neutral-700">Đánh dấu tất cả đã đọc</button>
        )}
      </div>
      {loading ? (
        <p className="text-sm text-neutral-500">Đang tải...</p>
      ) : notifs.length === 0 ? (
        <p className="text-sm text-neutral-500">Chưa có thông báo.</p>
      ) : (
        <div className="space-y-2">
          {notifs.map((n) => (
            <div key={n.id} className={`rounded-lg border p-3 ${n.is_read ? "border-neutral-200 dark:border-neutral-800 opacity-60" : "border-neutral-300 dark:border-neutral-700"}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">{n.type}</span>
                    <span className="text-sm">{n.message}</span>
                  </div>
                  <div className="text-xs text-neutral-500 mt-1">{new Date(n.created_at).toLocaleString("vi-VN")}</div>
                </div>
                {!n.is_read && (
                  <button onClick={() => markRead(n.id)} className="text-xs text-blue-600 hover:underline whitespace-nowrap">Đánh dấu đã đọc</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
