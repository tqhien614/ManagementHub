"use client";

import { useEffect, useState, useCallback } from "react";
import { request } from "@/lib/api";

type Config = { key: string; value: any; updated_at: string | null };

export default function AdminSystemPage() {
  const [configs, setConfigs] = useState<Config[]>([]);
  const [loading, setLoading] = useState(true);
  const [editKey, setEditKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await request<Config[]>("/admin/system");
    setConfigs(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSave(key: string) {
    try {
      const value = JSON.parse(editValue);
      const { error } = await request(`/admin/system/${key}`, { method: "PUT", body: JSON.stringify({ value }) });
      if (error) { setMsg(`Lỗi: ${error}`); return; }
      setMsg(`Đã lưu ${key}`);
      setEditKey(null);
      load();
    } catch {
      setMsg("JSON không hợp lệ");
    }
  }

  if (loading) return <p className="text-sm text-neutral-500">Đang tải...</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Cấu hình hệ thống</h1>
      {msg && <p className="text-sm text-green-600">{msg}</p>}
      <div className="space-y-4">
        {configs.map((c) => (
          <div key={c.key} className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium font-mono">{c.key}</h3>
              <button onClick={() => { setEditKey(c.key); setEditValue(JSON.stringify(c.value, null, 2)); }} className="text-xs px-2 py-1 rounded border border-neutral-300 dark:border-neutral-700">
                {editKey === c.key ? "Hủy" : "Sửa"}
              </button>
            </div>
            {editKey === c.key ? (
              <div className="space-y-2">
                <textarea value={editValue} onChange={(e) => setEditValue(e.target.value)} rows={6} className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm font-mono" />
                <button onClick={() => handleSave(c.key)} className="rounded-md bg-neutral-900 dark:bg-neutral-100 text-white dark:text-black px-3 py-1.5 text-sm">Lưu</button>
              </div>
            ) : (
              <pre className="text-sm text-neutral-600 dark:text-neutral-400 overflow-x-auto">{JSON.stringify(c.value, null, 2)}</pre>
            )}
            {c.updated_at && <p className="text-xs text-neutral-400 mt-2">Cập nhật: {new Date(c.updated_at).toLocaleString("vi-VN")}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
