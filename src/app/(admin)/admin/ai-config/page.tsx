"use client";

import { useEffect, useState, useCallback } from "react";
import { request } from "@/lib/api";

type AiConfig = { id: string; provider: string; model: string; default_prompt: string | null; quota_limit: number | null; is_active: boolean; updated_at: string };

export default function AdminAiConfigPage() {
  const [configs, setConfigs] = useState<AiConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await request<AiConfig[]>("/admin/ai-config");
    setConfigs(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleUpdate(id: string, field: string, value: any) {
    const { error } = await request(`/admin/ai-config/${id}`, { method: "PATCH", body: JSON.stringify({ [field]: value }) });
    if (error) { setMsg(`Lỗi: ${error}`); return; }
    setMsg("Đã cập nhật");
    load();
  }

  if (loading) return <p className="text-sm text-neutral-500">Đang tải...</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Cấu hình AI</h1>
      {msg && <p className="text-sm text-green-600">{msg}</p>}
      <div className="space-y-4">
        {configs.map((c) => (
          <div key={c.id} className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">{c.provider}</h3>
                <p className="text-sm text-neutral-500 font-mono">{c.model}</p>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={c.is_active} onChange={(e) => handleUpdate(c.id, "is_active", e.target.checked)} />
                Hoạt động
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <label className="text-xs text-neutral-500">Model</label>
                <input value={c.model} onChange={(e) => handleUpdate(c.id, "model", e.target.value)} className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent px-2 py-1.5 text-sm font-mono" />
              </div>
              <div>
                <label className="text-xs text-neutral-500">Quota (tokens/tháng)</label>
                <input type="number" value={c.quota_limit ?? ""} onChange={(e) => handleUpdate(c.id, "quota_limit", e.target.value ? parseInt(e.target.value) : null)} className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent px-2 py-1.5 text-sm" />
              </div>
            </div>
            <div>
              <label className="text-xs text-neutral-500">Default prompt</label>
              <textarea value={c.default_prompt ?? ""} onChange={(e) => handleUpdate(c.id, "default_prompt", e.target.value || null)} rows={3} placeholder="System prompt mặc định cho AI..." className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent px-2 py-1.5 text-sm" />
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-neutral-500">API key được lưu trong <code>backend/.env</code> (ANTHROPIC_AUTH_TOKEN) — không hiển thị ở đây vì lý do bảo mật.</p>
    </div>
  );
}
