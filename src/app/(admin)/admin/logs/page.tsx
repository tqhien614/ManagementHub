"use client";

import { useEffect, useState } from "react";
import { request } from "@/lib/api";

type AiLog = { id: string; user_id: string; conversation_id: string | null; prompt_tokens: number | null; completion_tokens: number | null; cost_usd: number | null; latency_ms: number | null; created_at: string };
type Activity = { id: string; user_id: string | null; action: string; target_type: string | null; target_id: string | null; metadata_json: any; created_at: string };

export default function AdminLogsPage() {
  const [tab, setTab] = useState<"activity" | "ai">("activity");
  const [activity, setActivity] = useState<Activity[]>([]);
  const [aiLogs, setAiLogs] = useState<AiLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    if (tab === "activity") {
      request<Activity[]>("/admin/activity?limit=100").then(({ data }) => { setActivity(data || []); setLoading(false); });
    } else {
      request<AiLog[]>("/admin/ai-logs?limit=100").then(({ data }) => { setAiLogs(data || []); setLoading(false); });
    }
  }, [tab]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Nhật ký</h1>
      <div className="flex gap-1 text-sm">
        <button onClick={() => setTab("activity")} className={`px-3 py-1 rounded-md ${tab === "activity" ? "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-black" : "border border-neutral-300 dark:border-neutral-700"}`}>Hoạt động user</button>
        <button onClick={() => setTab("ai")} className={`px-3 py-1 rounded-md ${tab === "ai" ? "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-black" : "border border-neutral-300 dark:border-neutral-700"}`}>Truy vấn AI</button>
      </div>

      {loading ? (
        <p className="text-sm text-neutral-500">Đang tải...</p>
      ) : tab === "activity" ? (
        activity.length === 0 ? (
          <p className="text-sm text-neutral-500">Chưa có log hoạt động.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 dark:bg-neutral-900 text-left text-neutral-500">
                <tr>
                  <th className="p-3 font-medium">Thời gian</th>
                  <th className="p-3 font-medium">User</th>
                  <th className="p-3 font-medium">Hành động</th>
                  <th className="p-3 font-medium">Đối tượng</th>
                </tr>
              </thead>
              <tbody>
                {activity.map((l) => (
                  <tr key={l.id} className="border-t border-neutral-200 dark:border-neutral-800">
                    <td className="p-3 text-neutral-500">{new Date(l.created_at).toLocaleString("vi-VN")}</td>
                    <td className="p-3 font-mono text-xs">{l.user_id ? l.user_id.slice(0, 8) : "—"}</td>
                    <td className="p-3">{l.action}</td>
                    <td className="p-3 text-neutral-500">{l.target_type || "—"}{l.target_id ? ` ${l.target_id.slice(0, 8)}` : ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : aiLogs.length === 0 ? (
        <p className="text-sm text-neutral-500">Chưa có log truy vấn AI.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 dark:bg-neutral-900 text-left text-neutral-500">
              <tr>
                <th className="p-3 font-medium">Thời gian</th>
                <th className="p-3 font-medium">User</th>
                <th className="p-3 font-medium">Prompt tok</th>
                <th className="p-3 font-medium">Completion tok</th>
                <th className="p-3 font-medium">Chi phí</th>
                <th className="p-3 font-medium">Độ trễ (ms)</th>
              </tr>
            </thead>
            <tbody>
              {aiLogs.map((l) => (
                <tr key={l.id} className="border-t border-neutral-200 dark:border-neutral-800">
                  <td className="p-3 text-neutral-500">{new Date(l.created_at).toLocaleString("vi-VN")}</td>
                  <td className="p-3 font-mono text-xs">{l.user_id.slice(0, 8)}</td>
                  <td className="p-3">{l.prompt_tokens ?? "—"}</td>
                  <td className="p-3">{l.completion_tokens ?? "—"}</td>
                  <td className="p-3">{l.cost_usd != null ? `$${l.cost_usd.toFixed(6)}` : "—"}</td>
                  <td className="p-3">{l.latency_ms ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
